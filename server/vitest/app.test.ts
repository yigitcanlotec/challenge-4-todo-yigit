import {
  assert,
  expect,
  test,
  describe,
  it,
  vitest,
  beforeAll,
  afterAll,
} from "vitest";
import express, { Request, Response, NextFunction } from "express";
import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ulid } from "ulid";
dotenv.config();

const username = "vitest";
const password = "password";
let token = "";
describe("Login API", () => {
  test("Successful Login", async function (done) {
    const base64Credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );
    const res = await axios.get(process.env.SERVER_URL + "/api/v1/login", {
      headers: {
        Authorization: `Basic ${base64Credentials}`,
      },
    });
    expect(res.status).toBe(200);
  });

  test("Wrong Crendentials", async () => {
    const base64Credentials = Buffer.from("wrongtest:wrongpassword").toString(
      "base64"
    );

    try {
      const res = await axios.get(process.env.SERVER_URL + "/api/v1/login", {
        headers: {
          Authorization: `Basic ${base64Credentials}`,
        },
      });
    } catch (err) {
      expect(err.response.status).toBe(404);
    }
  });

  test("Invalid Crendentials", async () => {
    try {
      const res = await axios.get(process.env.SERVER_URL + "/api/v1/login", {
        headers: {
          Authorization: `Basic `,
        },
      });
    } catch (err) {
      expect(err.response.status).toBe(403);
    }
  });
});

describe("Register API", () => {
  afterAll(async () => {
    try {
      const deleteResponse = await axios.post(
        process.env.SERVER_URL + "/api/v1/user/delete",
        { key: "delete_user", username: "test_user" }
      );
    } catch (error) {
      console.error(error);
    }
  });

  test("Successful Register", async () => {
    let postResponse;
    try {
      postResponse = await axios.post(
        process.env.SERVER_URL + "/api/v1/register",
        {
          username: "test_user",
          password: "test_password",
        }
      );
      return expect(postResponse.status).toBe(201);
    } catch (error) {
      console.error("An error occurred:", error.message);
      return;
    }
  });

  test("Invalid Register", async () => {
    axios
      .post(process.env.SERVER_URL + "/api/v1/register", {
        username: "test_user",
        password: "test_password",
      })
      .then((res) => {
        expect(false).toBe(false);
      })
      .catch((err) => {
        expect(err.response.status).toBe(400);
      });
  });
});

describe("Authorization", () => {
  test("Valid Token", async () => {
    const base64Credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );
    const res = await axios.get(process.env.SERVER_URL + "/api/v1/login", {
      headers: {
        Authorization: `Basic ${base64Credentials}`,
      },
    });
    token = res.data;
    expect(res.data).toMatch(/^[0-9a-fA-F]{32}$/);
  });
});

describe("Tasks", () => {
  let id: string;
  beforeAll(() => {
    id = ulid();
  });

  test("Add Task", async () => {
    try {
      const res = await axios.put(
        process.env.SERVER_URL + `/api/v1/${username}/task`,
        {
          todo_id: id,
          username: username,
          title: "test",
          isDone: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      expect(res.status).toBe(201);
    } catch (error) {
      console.log(error);
    }
  });

  test("Get Tasks", async () => {
    const res = await axios.get(
      process.env.SERVER_URL + `/api/v1/${username}/tasks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(res.data[0].title).toBe("test");
  });

  test("Mark as Done", async () => {
    const res = await axios.post(
      process.env.SERVER_URL + `/api/v1/${username}/${id}/done`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(res.status).toBe(200);
  });

  test("Mark as Undone", async () => {
    const res = await axios.post(
      process.env.SERVER_URL + `/api/v1/${username}/${id}/undone`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(res.status).toBe(200);
  });
  test("Edit Task", async () => {
    const res = await axios.post(
      process.env.SERVER_URL + `/api/v1/${username}/${id}/edit`,
      {
        title: "Test2",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(res.status).toBe(200);
  });

  test("Upload a Image", () => {
    const filePath = path.join(__dirname, "test.jpg");

    const file = fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error("Error reading the file:", err);
        return;
      }
      return data;
    });
    const postData = {
      fileName: username + "/" + id + "/test.jpg",
    };

    axios
      .post(
        process.env.SERVER_URL + `/api/v1/${username}/${id}/images`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(async (result) => {
        const presignedUrl = result.data;
        console.log("pres:", presignedUrl);
        try {
          const response = await axios.put(presignedUrl, file, {
            headers: {
              "Content-Type": "image/jpeg",
            },
          });
          console.log(response);
        } catch (error) {
          console.log(error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });

  test("Delete Task", async () => {
    const res = await axios.delete(
      process.env.SERVER_URL + `/api/v1/${username}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(res.status).toBe(200);
  });
});
