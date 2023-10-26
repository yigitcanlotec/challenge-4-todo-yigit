import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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
import crypto from "crypto";
import { marshall } from "@aws-sdk/util-dynamodb";

dotenv.config();
const app = express();
app.use(cors({ credentials: true }));
app.use(morgan("dev"));

function generateToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

const REGION = "eu-north-1";
const TABLE_NAME = "challenge-4-users-yigit";

const primaryKeyAttributeName = "username";
const primaryKeyValue = "example-user-id";

const dbClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
});

//---------------------------------------------------------
type Auth = { username: string; password: string } | null;

function parseBasicAuthHeader(authHeader: string): Auth {
  // Check if the header starts with "Basic"
  if (authHeader.startsWith("Basic ")) {
    // Extract the Base64 encoded portion
    const base64Credentials = authHeader.slice(6);

    // Decode the Base64 string
    const decodedString = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );

    // Split the decoded string into username and password
    const [username, password] = decodedString.split(":");

    return { username, password };
  }
  return null;
}

function getUserInfo(auth: Auth): Auth {
  if (auth) {
    return {
      username: auth.username,
      password: auth.password,
    };
  }
  return null;
}

//---------------------------------------------------------------------------

app.get("/login", async (req, res) => {
  // Receive auth info.
  const userInfo = getUserInfo(
    parseBasicAuthHeader(req.headers.authorization || "")
  );
  const username = userInfo?.username;
  const password = userInfo?.password;

  if (!username) return res.sendStatus(403);

  // Check if user exists or not.
  const command = new QueryCommand({
    TableName: TABLE_NAME,
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
    console.error("Error querying items from DynamoDB", err);
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
        TableName: TABLE_NAME,
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
        // console.log(updatedToken);
        return res.status(200).send(token);
      } catch (error) {
        // If something happens in this stage, then it's a server problem.
        console.error("Error adding item:", error);
        return res.sendStatus(500);
      }
    }
  }

  // If passwords not match.
  return res.sendStatus(403);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

app.use((req, res) => {
  res.sendStatus(418);
});
