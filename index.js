const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
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

    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ status: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        function (err, decoded) {
          if (err) {
            return res.status(401).send({ message: "unauthorized access" });
          }
          req.decoded = decoded;
          next();
        }
      );
    };
    // users api
    app.post("/jwt", async (req, res) => {
      const email = req.body.email;
      const token = jwt.sign(
        {
          email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "3h" }
      );
      res.send({ token });
    });
    app.get("/users/allUsers", verifyToken, async (req, res) => {
      const query = { type: "user" };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isUserExist = await userCollection.findOne(query);
      if (isUserExist) return res.send({ status: "user exists" });
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const updatedImage = req.body.newImage;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          image: updatedImage,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // user type update api
    app.patch(
      "/userType/makeDeliveryMen/:id",
      verifyToken,
      async (req, res) => {
        const userId = req.params.id;
        const query = { _id: new ObjectId(userId) };
        const updatedDoc = { $set: { type: "deliverymen" } };
        const result = await userCollection.updateOne(query, updatedDoc);
        res.send(result);
      }
    );
    app.patch("/userType/makeAdmin/:id", verifyToken, async (req, res) => {
      const userId = req.params.id;
      const query = { _id: new ObjectId(userId) };
      const updatedDoc = { $set: { type: "admin" } };
      const result = await userCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // delivery Mens api
    app.get("/deliveryMens", verifyToken, async (req, res) => {
      const query = { type: "deliverymen" };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // parcels api
    app.get("/parcels", verifyToken, async (req, res) => {
      console.log("entered parcels", req.query.email);
      const email = req.query.email;
      const query = { email: email };
      const result = await parcelCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/parcels/allParcels", verifyToken, async (req, res) => {
      const result = await parcelCollection.find().toArray();
      res.send(result);
    });
    app.get("/parcels/users/allParcels", verifyToken, async (req, res) => {
      const query = { status: { $ne: "cancel" } };
      const result = await parcelCollection.find(query).toArray();
      res.send(result);
    });
    app.get(`/parcels/updateParcel/:id`, verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelCollection.findOne(query);
      res.send(result);
    });

    app.post("/parcels", verifyToken, async (req, res) => {
      const newParcel = req.body;
      const result = await parcelCollection.insertOne(newParcel);
      res.send(result);
    });
    app.put("/parcels", verifyToken, async (req, res) => {
      const parcel = req.body;
      const filter = { _id: new ObjectId(parcel.id) };
      const updateDoc = {
        $set: {
          email: parcel.email,
          name: parcel.name,
          phoneNumber: parcel.phoneNumber,
          parcelType: parcel.parcelType,
          receiversName: parcel.receiversName,
          receiversPhoneNumber: parcel.receiversPhoneNumber,
          parcelWeight: parcel.parcelWeight,
          deliveryAddress: parcel.deliveryAddress,
          latitude: parcel.latitude,
          longitude: parcel.longitude,
          deliveryDate: parcel.deliveryDate,
          price: parcel.price,
          status: "pending",
        },
      };

      const result = await parcelCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/parcels", verifyToken, async (req, res) => {
      const updatedStatus = req.body.status;
      const filter = { _id: new ObjectId(req.body.id) };
      const updateDoc = {
        $set: {
          status: updatedStatus,
        },
      };
      const result = await parcelCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/parcels/setDeliveryMen", verifyToken, async (req, res) => {
      const updatedData = req.body;
      const parcelId = updatedData.parcelId;
      const filter = { _id: new ObjectId(parcelId) };
      const updateDoc = {
        $set: {
          status: updatedData.updatedStatus,
          deliveryMenId: updatedData.deliveryMenId,
          approximateDeliveryDate: updatedData.approximateDeliveryDate,
        },
      };
      const result = await parcelCollection.updateOne(filter, updateDoc);
      res.send(result);
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
