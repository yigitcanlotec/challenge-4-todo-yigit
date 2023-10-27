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
  AttributeValue,
  PutItemCommand,
  UpdateItemCommand,
  UpdateItemCommandOutput,
  ReturnValue,
} from "@aws-sdk/client-dynamodb";
import morgan from "morgan";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";
//----------------------------------
// Configurations.
dotenv.config();
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
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
app.get("api/v1/login", async (req, res) => {
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

//-------------------------------------
// For invalid path, return response 418.
app.use((req, res) => {
  res.sendStatus(418);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});