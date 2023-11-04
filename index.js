const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to my assignment application server");
});
app.listen(port, (req, res) => {
  console.log(`Server is Running on port ${port}`);
});
