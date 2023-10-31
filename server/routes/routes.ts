import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import {
  generateToken,
  sanitizeInput,
  parseBasicAuthHeader,
  parseBearerAuthHeader,
  getUserInfo,
} from "../utils/utils";

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
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2CommandOutput,
  ListObjectsV2CommandInput,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import morgan from "morgan";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

dotenv.config();
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

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
  // If token is invalid then return status 400.
  if (!token) return res.status(400).send("Invalid authorization info.");

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
      // Invalid authentication.
      return res.sendStatus(404);
    for (const item of results.Items) {
      if (item.session_key && item.session_key.S === token) {
        return next(); // Valid authentication.
      }
    }
    return res.sendStatus(403);
  } catch (err) {
    return res.sendStatus(500);
  }
}

async function login(req: Request, res: Response) {
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
    console.log(err);
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
}

async function register(req: Request, res: Response) {
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
}

async function getTasks(req: Request, res: Response) {
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

    return res.status(204).send("There are no tasks.");
  } catch (err) {
    // logger(req, res, function (error) {
    //   if (error) return error.message;
    // });

    // If error occurs in the query, send the 500 error.
    return res.sendStatus(500);
  }
}

async function addTask(req: Request, res: Response) {
  // Sanitized from XSS.
  const purifiedUsername = DOMPurify.sanitize(req.params.user);
  if (
    typeof req.body.isDone !== "boolean" ||
    typeof req.body.title !== "string" ||
    typeof req.body.todo_id !== "string"
  )
    return res.status(400).send("Invalid parameters.");

  const purifiedTitle = DOMPurify.sanitize(req.body.title);

  const item = {
    todo_id: { S: req.body.todo_id },
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
}

async function deleteTask(req: Request, res: Response) {
  const purifiedUsername = DOMPurify.sanitize(req.params.user);
  const purifiedTaskID = DOMPurify.sanitize(req.params.taskId);

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
}

async function markAsTaskDone(req: Request, res: Response) {
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
}

async function markAsTaskUndone(req: Request, res: Response) {
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
}

async function editTask(req: Request, res: Response) {
  const purifiedUsername = DOMPurify.sanitize(req.params.user);
  const purifiedTaskID = DOMPurify.sanitize(req.params.taskId);

  if (!req.body.title || typeof req.body.title !== "string")
    return res.status(400).send("Invalid parameters.");
  const purifiedTitle = DOMPurify.sanitize(req.body.title);

  const params = {
    TableName: process.env.TODO_TABLE_NAME,
    Key: marshall({
      username: purifiedUsername,
      todo_id: purifiedTaskID,
    }),
    UpdateExpression: "set title = :title",
    ExpressionAttributeValues: marshall({
      ":title": purifiedTitle,
    }),
    ReturnValues: ReturnValue.UPDATED_NEW,
  };

  try {
    const updatedItem: UpdateItemCommandOutput = await dbClient.send(
      new UpdateItemCommand(params)
    );
    if (updatedItem.$metadata.httpStatusCode === 200) {
      return res.status(200).send("Successfully updated!");
    } else {
      return res.sendStatus(400);
    }
  } catch (err) {
    return res.sendStatus(500);
  }
}

async function getImages(req: Request, res: Response) {
  if (
    process.env.REGION === undefined ||
    process.env.ACCESS_KEY_ID === undefined ||
    process.env.SECRET_ACCESS_KEY === undefined
  )
    return res.status(400).send("Invalid authorization.");

  const s3Client: S3Client = new S3Client({
    region: process.env.REGION!,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });

  let command: ListObjectsV2Command = new ListObjectsV2Command({
    Bucket: process.env.BUCKET_NAME,
    Prefix: req.params.user + "/",
  });

  const response: ListObjectsV2CommandOutput = await s3Client.send(command);

  if (response.Contents) {
    // console.log(response.Contents);
    if (!response.Contents) return res.status(204).send("Images not found.");
    const files: string[] = (response.Contents as any[]).map(
      (object: any) => object.Key
    );
    const promises = files.map(async (file) => {
      return getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: file,
        }),
        { expiresIn: 60 }
      );
    });

    Promise.all(promises)
      .then((results) => {
        const fileLinkArray: string[] = results;
        const mapping: Record<string, any> = {};

        files.forEach((key, index) => {
          mapping[key] = fileLinkArray[index];
        });
        res.status(200).send(mapping);
      })
      .catch((error) => {
        res.sendStatus(500);
      });
  } else {
    res.sendStatus(204);
  }
}

async function uploadImages(req: Request, res: Response) {
  if (req.body.fileName === undefined || typeof req.body.fileName !== "string")
    return res.status(400).send("Invalid request body parameter.");
  const s3Client = new S3Client({
    region: process.env.REGION!,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: req.body.fileName,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  res.status(200).send(url);
}

async function deleteImages(req: Request, res: Response) {
  const s3Client = new S3Client({
    region: process.env.REGION!,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });

  console.log(req.params.user, req.params.taskId);

  try {
    const params: DeleteObjectCommandInput = {
      Bucket: process.env.BUCKET_NAME,
      Key: req.params.user + "/" + req.params.taskId + "/",
    };

    const command = new DeleteObjectCommand(params);
    const response = await s3Client.send(command);

    // console.log(`Successfully deleted ${OBJECT_KEY} from ${BUCKET_NAME}`, response);

    if (response.$metadata.httpStatusCode === 200)
      return res.status(200).send("Deleted.");
    return res.sendStatus(response.$metadata.httpStatusCode!);
  } catch (error) {
    // console.error("Error deleting object:", error);
    return res.status(500).send("Delete operation server error.");
  }
}

export {
  login,
  isAuthenticated,
  register,
  getTasks,
  addTask,
  deleteTask,
  markAsTaskDone,
  markAsTaskUndone,
  editTask,
  getImages,
  uploadImages,
  deleteImages,
};
