const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hrheaqm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("shipSwiftlyDB").collection("users");
    const parcelCollection = client.db("shipSwiftlyDB").collection("parcels");

    // users api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isUserExist = await userCollection.findOne(query);
      if (isUserExist) return res.send({ status: "user exists" });
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    // parcels api
    app.post("/parcels", async (req, res) => {
      const newParcel = req.body;
      const result = await parcelCollection.insertOne(newParcel);
      res.send(result);
    });
    app.get("/parcels", async (req, res) => {
      const email = req.query.email;
      console.log("email is", email);
      const query = { email: email };
      const result = await parcelCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/wow", async (req, res) => {
      // const id = req.params.id;
      console.log("hitting inside");
      // const query = { _id: new ObjectId(id) };
      // const result = await parcelCollection.findOne(query);
      // res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("shipSwiftly Running");
});

app.listen(port, () => {
  console.log(`shipSwiftly Running on port ${port}`);
});
