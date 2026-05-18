const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  tls: true,
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.log(error);
  }
}

connectDB();

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
}

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Study Planner Backend Running");
});

app.get("/users", async (req, res) => {
  const users = await db.collection("users").find().toArray();
  res.json(users);
});
// COURSES
app.post("/courses", auth, async (req, res) => {
  const course = {
    ...req.body,
    userId: req.userId,
  };

  const result = await db.collection("courses").insertOne(course);

  res.json(result);
});

app.get("/courses", auth, async (req, res) => {
  const courses = await db
    .collection("courses")
    .find({ userId: req.userId })
    .toArray();

  res.json(courses);
});

// TASKS
app.post("/tasks", auth, async (req, res) => {
  const task = {
    ...req.body,
    userId: req.userId,
  };

  const result = await db.collection("tasks").insertOne(task);

  res.json(result);
});

app.get("/tasks", auth, async (req, res) => {
  const tasks = await db
    .collection("tasks")
    .find({ userId: req.userId })
    .toArray();

  res.json(tasks);
});

// DELETE COURSE
app.delete("/courses/:id", auth, async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const result = await db.collection("courses").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId,
    });

    res.json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error deleting course",
    });
  }
});

// UPDATE COURSE
app.put("/courses/:id", auth, async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const updatedCourse = req.body;

    const result = await db.collection("courses").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: req.userId,
      },
      {
        $set: updatedCourse,
      },
    );

    res.json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error updating course",
    });
  }
});

// STUDY SCHEDULE
app.post("/studySchedule", auth, async (req, res) => {
  const schedule = {
    ...req.body,
    userId: req.userId,
  };
  const result = await db.collection("studySchedule").insertOne(schedule);
  res.json(result);
});

app.get("/studySchedule", auth, async (req, res) => {
  const schedule = await db
    .collection("studySchedule")
    .find({ userId: req.userId })
    .toArray();
  res.json(schedule);
});

// DELETE STUDY SCHEDULE
app.delete("/studySchedule/:id", auth, async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const result = await db.collection("studySchedule").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId,
    });

    res.json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error deleting session",
    });
  }
});

// UPDATE STUDY SESSION STATUS
app.put("/studySchedule/:id/status", auth, async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const { status } = req.body;

    const session = await db.collection("studySchedule").findOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await db.collection("studySchedule").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: req.userId,
      },
      {
        $set: { status: status },
      },
    );

    if (status === "missed") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const currentIndex = days.indexOf(session.day);

      const newDay = days[(currentIndex + 2) % 7];

      const newSession = {
        ...session,
        _id: undefined,
        day: newDay,
        status: "pending",
        title: session.title + " (Rescheduled)",
      };

      delete newSession._id;

      await db.collection("studySchedule").insertOne(newSession);
    }

    res.json({ message: "Session updated successfully" });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error updating session status",
    });
  }
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
    };

    const result = await db.collection("users").insertOne(newUser);

    const token = jwt.sign(
      {
        userId: result.insertedId,
        email: email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});
// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// AI HELPER
app.post("/ai-helper", async (req, res) => {
  try {
    const { question } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "You are a helpful study assistant. Give a short and clear study tip. If the message is not related to studying, exams, stress, deadlines, or assignments, say: I did not understand your question. Please ask about studying, exams, stress, deadlines, or assignments.\n\nStudent question: " +
                    question,
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    res.json({
      answer: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response",
    });
  } catch (error) {
    res.status(500).json({ message: "AI integration error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
