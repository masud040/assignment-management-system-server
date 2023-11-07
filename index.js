const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");
var cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://6549368f8aef333804f980fe--fabulous-sunburst-130e1e.netlify.app",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yngtotr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // await client.connect();

    const assignmentCollection = client
      .db("assignmentsDB")
      .collection("assignments");
    const features = client.db("assignmentsDB").collection("features");
    const faqCollection = client
      .db("assignmentsDB")
      .collection("frequently-asked-question");
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
          // sameSite: "None",
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
    app.get("/features", async (req, res) => {
      const result = await features.find().toArray();
      res.send(result);
    });
    app.get("/faq", async (req, res) => {
      const result = await faqCollection.find().toArray();
      res.send(result);
    });
    // assignment related
    app.get("/assignments", async (req, res) => {
      const query = {};

      const difficultLevel = req.query.difficultLevel;
      const page = Number(req.query.page);
      const size = Number(req.query.size);
      if (difficultLevel) {
        query.difficultLevel = difficultLevel;
      }

      const cursor = assignmentCollection
        .find(query)
        .skip(page * size)
        .limit(size);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/count", async (req, res) => {
      const result = await assignmentCollection.estimatedDocumentCount();
      res.send({ total: result });
    });
    app.post("/create-assignment", verifyToken, async (req, res) => {
      if (req.user?.email !== req.query?.email) {
        return res.status(403).send({ message: "Forbidden" });
      }
      const assignment = req.body.assignment;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });
    app.get("/assignment", verifyToken, async (req, res) => {
      if (req.user?.email !== req.query?.email) {
        return res.status(403).send({ message: "Forbidden" });
      }
      const id = req.query.id;

      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });
    app.patch("/assignment", async (req, res) => {
      const id = req.query.id;
      const assignment = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = {};
      const cursor = await assignmentCollection.findOne(filter);
      if (cursor.email === assignment.email) {
        const update = {
          $set: {
            email: assignment.email,
            title: assignment.title,
            marks: assignment.marks,
            thumbnail: assignment.thumbnail,
            date: assignment.date,
            description: assignment.description,
            difficultLevel: assignment.difficultLevel,
          },
        };
        const result = await assignmentCollection.updateOne(
          filter,
          update,
          options
        );
        res.send(result);
      } else {
        res.send({ message: "you can't update this assignment" });
      }
    });
    app.delete("/assignment", async (req, res) => {
      const id = req.query.id;
      const email = req.query.email;
      const query = { _id: new ObjectId(id) };
      const cursor = await assignmentCollection.findOne(query);
      if (cursor.email === email) {
        const result = await assignmentCollection.deleteOne(query);
        res.send(result);
      } else {
        res.send({ message: "Not Allow to delete this assignment" });
      }
    });
    app.get("/submitted-assignments", verifyToken, async (req, res) => {
      if (req.query?.email !== req.user?.email) {
        return res.status(403).send({ message: "Forbidden" });
      }
      const query = {};
      const status = req.query?.status;
      const email = req.query?.email;

      if (status) {
        query.status = status;
      }
      if (email) {
        query.email = email;
      }

      const cursor = submittedAssignmentColl.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/submit-assignment", verifyToken, async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const result = await submittedAssignmentColl.findOne(query);
      res.send(result);
    });
    app.post("/submit-assignment", async (req, res) => {
      const assignment = req.body;
      const result = await submittedAssignmentColl.insertOne(assignment);
      res.send(result);
    });
    app.patch("/submitted-assignment", async (req, res) => {
      const id = req.query.id;
      const assignment = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const update = {
        $set: {
          obtainMark: assignment.obtainMark,
          feedback: assignment.feedback,
          status: assignment.status,
        },
      };
      const result = await submittedAssignmentColl.updateOne(
        filter,
        update,
        options
      );
      console.log(id);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Welcome to my assignment application server");
});
app.listen(port, (req, res) => {
  console.log(`Server is Running on port ${port}`);
});
