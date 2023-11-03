import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import morgan from "morgan";
import * as http from "http";
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
  deleteUserFromDB,
} from "./routes/routes";

//----------------------------------
// Configurations.

const app = express();
app.use(cors());

morgan.token("status-text", function (req, res) {
  return http.STATUS_CODES[res.statusCode];
});

const morganFormat =
  ":method :url :status :status-text :res[content-length] - :response-time ms";

app.use(morgan(morganFormat));

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

const router = Router();

app.get("/api/v1/login", login);
app.post("/api/v1/register", register);
app.post("/api/v1/user/delete", deleteUserFromDB);
app.use(router);
router.use(isAuthenticated);
router.get("/api/v1/:user/tasks", getTasks);
router.put("/api/v1/:user/task", addTask);
router.delete("/api/v1/:user/:taskId", deleteTask);
router.post("/api/v1/:user/:task/done", markAsTaskDone);
router.post("/api/v1/:user/:task/undone", markAsTaskUndone);
router.post("/api/v1/:user/:taskId/edit", editTask);
//---------------IMAGES----------------
router.get("/api/v1/:user/tasks/images", getImages);
router.post("/api/v1/:user/:taskId/images", uploadImages);
router.delete("/api/v1/:user/:taskId/images", deleteImages);

//-------------------------------------
// For invalid path, return response 418.
app.use((req, res) => {
  res.status(418);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
