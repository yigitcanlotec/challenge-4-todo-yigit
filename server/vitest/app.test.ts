import { assert, expect, test, describe, it, vitest, beforeAll } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
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

describe("Test APIs", () => {
  it("Login", async function (done) {
    const base64Credentials = Buffer.from("test:password").toString("base64");
    const res = await axios.get("http://localhost:3000/api/v1/login", {
      headers: {
        Authorization: `Basic ${base64Credentials}`,
      },
    });

    expect(res.status).toBe(200);
    expect(res.data).toMatch(/^[0-9a-fA-F]{32}$/);
  });

  it("Register");
});
