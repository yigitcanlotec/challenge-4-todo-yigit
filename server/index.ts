import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import {
  generateToken,
  sanitizeInput,
  parseBasicAuthHeader,
  parseBearerAuthHeader,
  getUserInfo,
} from "./utils/utils";

import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandOutput,
  GetItemCommand,
  DeleteItemCommand,
  AttributeValue,
  PutItemCommand,
  UpdateItemCommand,
  UpdateItemInput,
  UpdateItemCommandOutput,
  ReturnValue,
  DeleteItemInput,
} from "@aws-sdk/client-dynamodb";
import morgan from "morgan";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
//----------------------------------
// Configurations.
dotenv.config();
const app = express();
app.use(cors());
app.use(morgan("dev"));
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

interface ExpressJSError extends SyntaxError {
  status?: number;
  body?: any;
}

app.use(express.json());

// Invalid JSON causes Unexpected token error so prevent similar situations like this:
app.use(
  (
    err: ExpressJSError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).send({ error: "Invalid JSON" }); // Bad request
    }
    next();
  }
);

// Globals.
const logger = morgan("combined");
const dbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
});

async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.headers.authorization) return res.sendStatus(400);
  const token = parseBearerAuthHeader(req.headers.authorization);
  if (!token) return res.sendStatus(400);

  const command = new QueryCommand({
    TableName: process.env.USER_TABLE_NAME,
    IndexName: "session_key-index",
    KeyConditionExpression: "session_key = :key",
    ExpressionAttributeValues: {
      ":key": { S: token },
    },
  });

  try {
    const results = await dbClient.send(command);
    if (!results.Count || results.Items === undefined)
      return res.sendStatus(404);
    for (const item of results.Items) {
      if (item.session_key && item.session_key.S === token) {
        return next();
      }
    }
    return res.sendStatus(403);
  } catch (err) {
    return res.sendStatus(500);
  }
}

//------------------API ROUTE--------------------------
app.get("/api/v1/login", async (req, res) => {
  // Receive auth info.
  const userInfo = getUserInfo(
    parseBasicAuthHeader(req.headers.authorization || "")
  );
  const username = userInfo?.username;
  const password = userInfo?.password;

  if (!username) return res.sendStatus(403);

  // Check if user exists or not.
  const command = new QueryCommand({
    TableName: process.env.USER_TABLE_NAME,
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: {
      ":username": { S: username },
    },
  });

  // Store results in results variable.
  let results: QueryCommandOutput;
  try {
    results = await dbClient.send(command);
  } catch (err) {
    // If error occurs in the query, send the 500 error.
    logger(req, res, function (error) {
      if (error) return error.message;
    });
    return res.sendStatus(500);
  }

  // If user and results not exists, return 404.
  if (!results.Count || results.Items === undefined) return res.sendStatus(404);

  // If user is exist, first check the password.
  for (const item of results.Items) {
    if (item.password && item.password.S === password) {
      // Then generate session token for user.
      const token = generateToken();

      // Then write to the db and send the token to user.

      const params = {
        TableName: process.env.USER_TABLE_NAME,
        Key: marshall({
          username: username,
        }),
        UpdateExpression: "set session_key = :session_key",
        ExpressionAttributeValues: marshall({
          ":session_key": token,
        }),
        ReturnValues: ReturnValue.UPDATED_NEW,
      };

      try {
        const updatedToken: UpdateItemCommandOutput = await dbClient.send(
          new UpdateItemCommand(params)
        );
        if (updatedToken.$metadata.httpStatusCode === 200) {
          //If user exists;
          return res.status(200).send(token);
        } else if (updatedToken.$metadata.httpStatusCode === 204) {
          //If no content;
          return res.sendStatus(204);
        } else {
          //Then it must be server issue.;
          return res.sendStatus(500);
        }
      } catch (error) {
        // If something happens in this stage, then it's a server problem.
        logger(req, res, function (error) {
          if (error) return error.message;
        });
        return res.sendStatus(500);
      }
    }
  }
  // If passwords not match.
  return res.sendStatus(403);
});

app.post("/api/v1/register", async (req, res) => {
  // Check username and password not empty or contains invalid(:) characters.
  // According to HTTP Basic Auth, user-id not contains colon(:) char.

  if (
    req.body.username === "" ||
    req.body.password === "" ||
    typeof req.body.username !== "string" ||
    typeof req.body.password !== "string" ||
    req.body.username.includes(":")
  )
    return res.sendStatus(400);

  //Put item to DynamoDb.
  try {
    const result = await dbClient.send(
      new PutItemCommand({
        TableName: process.env.USER_TABLE_NAME,
        Item: {
          username: { S: req.body.username },
          password: { S: req.body.password },
        },
      })
    );

    if (result.$metadata.httpStatusCode === 200) {
      //If successful;
      return res.sendStatus(201);
    } else if (result.$metadata.httpStatusCode === 204) {
      //If something happens and user not created;
      return res.sendStatus(405);
    } else {
      //Then it must be server issue.;
      return res.sendStatus(500);
    }
  } catch (error) {
    // If error occurs, then return the 500 error.
    logger(req, res, function (error) {
      if (error) return error.message;
    });
    return res.sendStatus(500);
  }
});

app.get("/api/v1/:user/tasks", isAuthenticated, async (req, res) => {
  const command = new QueryCommand({
    TableName: process.env.TODO_TABLE_NAME,
    IndexName: "username-index",
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: {
      ":username": { S: req.params.user },
    },
  });

  let results: QueryCommandOutput;
  try {
    results = await dbClient.send(command);
    if (results.Items) {
      const parsedItems = results.Items.map((item) => {
        return {
          todo_id: item.todo_id.S,
          title: item.title.S,
          isDone: item.isDone.BOOL,
        };
      });
      return res.status(200).send(parsedItems);
    }
    return res.sendStatus(204);
  } catch (err) {
    // If error occurs in the query, send the 500 error.
    // logger(req, res, function (error) {
    //   if (error) return error.message;
    // });
    console.log(req.params.user);
    console.log(err);
    return res.sendStatus(500);
  }
});

app.put("/api/v1/:user/task", isAuthenticated, async (req, res) => {
  // Sanitized from XSS.

  const purifiedUsername = DOMPurify.sanitize(req.params.user);
  const purifiedTitle = DOMPurify.sanitize(req.body.title);
  if (typeof req.body.isDone !== "boolean")
    return res.status(400).send("isDone must be boolean.");

  const item = {
    todo_id: { S: ulid() },
    username: { S: purifiedUsername },
    title: { S: purifiedTitle },
    isDone: { BOOL: req.body.isDone },
  };

  const command = new PutItemCommand({
    TableName: process.env.TODO_TABLE_NAME,
    Item: item as Record<string, AttributeValue>,
  });

  const result = await dbClient.send(command);

  if (result.$metadata.httpStatusCode === 200) {
    //If successful;
    return res.sendStatus(201);
  } else if (result.$metadata.httpStatusCode === 204) {
    //If something happens and tasks not added;
    return res.sendStatus(400);
  } else {
    //Then it must be server issue.;
    return res.sendStatus(500);
  }
});

app.delete("/api/v1/:user/:taskId", isAuthenticated, async (req, res) => {
  const purifiedUsername = DOMPurify.sanitize(req.params.user);
  const purifiedTaskID = DOMPurify.sanitize(req.params.taskId);
  // if (!req.par.todo_id || typeof req.body.todo_id !== "string")
  //   return res.sendStatus(400);

  const command = new DeleteItemCommand({
    TableName: process.env.TODO_TABLE_NAME,
    Key: {
      username: { S: purifiedUsername },
      todo_id: { S: purifiedTaskID },
    },
  });

  try {
    const result = await dbClient.send(command);
    if (result.$metadata.httpStatusCode === 200) {
      //If successful;
      return res.sendStatus(200);
    } else if (result.$metadata.httpStatusCode === 204) {
      //If something happens and tasks not deleted;
      return res.sendStatus(400);
    } else {
      //Then it must be server issue.;
      return res.sendStatus(500);
    }
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post("/api/v1/:user/:task/done", isAuthenticated, async (req, res) => {
  const params = {
    TableName: process.env.TODO_TABLE_NAME!,
    Key: {
      username: { S: req.params.user },
      todo_id: { S: req.params.task },
    },
    UpdateExpression: "set isDone = :newValue",
    ExpressionAttributeValues: {
      ":newValue": { BOOL: true },
    },
  };

  const command = new UpdateItemCommand(params);

  try {
    const result = await dbClient.send(command);
    if (result.$metadata.httpStatusCode === 200) {
      return res.sendStatus(200);
    } else {
      return res.sendStatus(400);
    }
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post("/api/v1/:user/:task/undone", isAuthenticated, async (req, res) => {
  const params = {
    TableName: process.env.TODO_TABLE_NAME!,
    Key: {
      username: { S: req.params.user },
      todo_id: { S: req.params.task },
    },
    UpdateExpression: "set isDone = :newValue",
    ExpressionAttributeValues: {
      ":newValue": { BOOL: false },
    },
  };

  const command = new UpdateItemCommand(params);

  try {
    const result = await dbClient.send(command);
    if (result.$metadata.httpStatusCode === 200) {
      return res.sendStatus(200);
    } else {
      return res.sendStatus(400);
    }
  } catch (error) {
    return res.sendStatus(500);
  }
});

//-------------------------------------
// For invalid path, return response 418.
app.use((req, res) => {
  res.sendStatus(418);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
