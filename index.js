const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
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
    await client.connect();

    // api rqst
    const eventCollection = client.db("eventDB").collection("events");

    // app.get("/allEvents", async (req, res) => {
    //   const result = await eventCollection.find().toArray();
    //   res.send(result);
    // });
    // app.get("/allEvents", async (req, res) => {
    //   try {
    //     const result = await eventCollection
    //       .find()
    //       .sort({ dateTime: -1 }) // DESC: সর্বশেষ event আগে আসবে
    //       .toArray();
    //     res.send(result);
    //   } catch (error) {
    //     console.error("Error fetching events:", error);
    //     res.status(500).send({ message: "Internal Server Error" });
    //   }
    // });
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

    // Send a ping to confirm a successful connection
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
  res.send("Evibe Server is running");
});

app.listen(port, () => {
  console.log(`Evibe server is running on port: ${port}`);
});
