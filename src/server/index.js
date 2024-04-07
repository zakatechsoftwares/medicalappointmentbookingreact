/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import connectToMongo from "./db.js";
import authRouter from "./routes/auth.js";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const PORT = process.env.PORT || 8181;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectToMongo();

// Routes
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
