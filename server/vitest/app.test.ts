import { assert, expect, test, describe, it, vitest, beforeAll } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";
import {
  isAuthenticated,
  login,
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
} from "../routes/routes";

dotenv.config();

describe("Login API", () => {
  test("Successful Login", async function (done) {
    const base64Credentials = Buffer.from("test:password").toString("base64");
    const res = await axios.get(process.env.SERVER_URL + "/api/v1/login", {
      headers: {
        Authorization: `Basic ${base64Credentials}`,
      },
    });

    expect(res.status).toBe(200);
    expect(res.data).toMatch(/^[0-9a-fA-F]{32}$/);
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
