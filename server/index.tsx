import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());

app.post("/login", (req, res) => {
  res.status(200).send(JSON.stringify(req.body));
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

app.use((req, res) => {
  res.sendStatus(418);
});
