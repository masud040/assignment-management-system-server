const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yngtotr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    const assignmentCollections = client
      .db("assignmentsDB")
      .collection("assignments");

    //   jwt -> json web token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      res.send(user);
    });
    //   create assignment
    app.post("/create-assignment", async (req, res) => {
      const assignment = req.body;
      console.log(assignment);
      res.send(assignment);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Welcome to my assignment application server");
});
app.listen(port, (req, res) => {
  console.log(`Server is Running on port ${port}`);
});
