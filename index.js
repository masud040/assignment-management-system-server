const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
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

    const assignmentCollection = client
      .db("assignmentsDB")
      .collection("assignments");
    const submittedAssignmentColl = client
      .db("assignmentsDB")
      .collection("submittedAssignments");

    //   jwt -> json web token related
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1hr",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", {
          maxAge: 0,
        })
        .send({ success: true });
    });
    // assignment related
    app.get("/assignments", async (req, res) => {
      const query = {};
      const difficultLevel = req.query.difficultLevel;
      if (difficultLevel) {
        query.difficultLevel = difficultLevel;
      }

      const cursor = assignmentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/create-assignment", async (req, res) => {
      const assignment = req.body.assignment;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });
    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });
    app.post("/submit-assignment", async (req, res) => {
      const assignment = req.body.assignment;
      console.log(assignment);
      res.send([]);
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
