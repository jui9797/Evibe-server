const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwr0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    // api rqst
    const eventCollection = client.db("eventDB").collection("events");
    const userCollection = client.db("eventDB").collection("users");

    app.post("/register", async (req, res) => {
      try {
        const { name, email, password, photoURL } = req.body;

        // Check if email already exists
        const existingUser = await userCollection.findOne({ email });

        if (existingUser) {
          return res.status(400).send({ message: "Email already registered" });
        }

        const newUser = {
          name,
          email,
          password,
          photoURL,
          createdAt: new Date(),
        };

        const result = await userCollection.insertOne(newUser);

        res.status(201).send({
          message: "User registered successfully",
          userId: result.insertedId,
        });
      } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.get("/allUsers", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/allEvents", async (req, res) => {
      try {
        const { title, filter } = req.query;
        const query = {};

        // Search by title (case-insensitive)
        if (title) {
          query.eventTitle = { $regex: title, $options: "i" };
        }

        // Date filtering
        const now = new Date();

        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const endOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setDate(startOfWeek.getDate() - 1);
        endOfLastWeek.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999
        );

        if (filter === "today") {
          query.dateTime = { $gte: startOfToday, $lte: endOfToday };
        } else if (filter === "currentWeek") {
          query.dateTime = { $gte: startOfWeek, $lte: endOfWeek };
        } else if (filter === "lastWeek") {
          query.dateTime = { $gte: startOfLastWeek, $lte: endOfLastWeek };
        } else if (filter === "currentMonth") {
          query.dateTime = { $gte: startOfMonth, $lte: endOfMonth };
        } else if (filter === "lastMonth") {
          query.dateTime = { $gte: startOfLastMonth, $lte: endOfLastMonth };
        }

        const result = await eventCollection
          .find(query)
          .sort({ dateTime: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.post("/events", async (req, res) => {
      const newEvent = req.body;
      const result = await eventCollection.insertOne(newEvent);
      res.send(result);
    });
    // count increse
    app.patch("/events/join/:id", async (req, res) => {
      const eventId = req.params.id;
      const { email } = req.body;

      const event = await eventCollection.findOne({
        _id: new ObjectId(eventId),
      });

      if (event.joinedEmails?.includes(email)) {
        return res.status(400).send({ message: "User already joined" });
      }

      const result = await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        {
          $inc: { attendeeCount: 1 },
          $addToSet: { joinedEmails: email }, // array to track who joined
        }
      );

      res.send(result);
    });

    // event by email
    app.get("/eventsByEmail", async (req, res) => {
      const email = req.query.email;

      try {
        let query = {};
        if (email) {
          query.email = email;
        }

        const events = await eventCollection.find(query).toArray();
        res.send(events);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        res.status(500).send({ message: "Server Error" });
      }
    });
    // delete event
    app.delete("/events/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await eventCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Event deleted successfully" });
        } else {
          res.status(404).json({ message: "Event not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Failed to delete event", error });
      }
    });

    // update event by id
    app.put("/events/:id", async (req, res) => {
      const id = req.params.id;
      const updatedEvent = req.body;

      try {
        const result = await eventCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedEvent }
        );

        if (result.modifiedCount > 0) {
          res.send({ message: "Event updated successfully", modifiedCount: 1 });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or no changes made" });
        }
      } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Evibe Server is running");
});

app.listen(port, () => {
  console.log(`Evibe server is running on port: ${port}`);
});
