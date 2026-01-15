const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

/* ==========================
   MIDDLEWARE
========================== */
app.use(express.json());
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

/* ==========================
   MONGODB CONNECTION
========================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err));

/* ==========================
   EMAIL SETUP
========================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ==========================
   TEST ROUTE
========================== */
app.get("/", (req, res) => {
  res.json({ message: "API is alive 🚀" });
});

/* ==========================
   APPOINTMENT SCHEMA
========================== */
const appointmentSchema = new mongoose.Schema(
  {
    fullName: String,
    mobileNumber: String,
    emailAddress: String,
    department: String,
    doctorName: String,
    reasonForVisit: String,
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

/* ==========================
   CREATE APPOINTMENT
========================== */
app.post("/api/appointments", async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();

    await transporter.sendMail({
      from: `"Vertex Healthcare" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "🩺 New Appointment",
      text: JSON.stringify(req.body, null, 2),
    });

    res.status(201).json({ message: "Appointment booked successfully" });
  } catch (err) {
    console.error("❌ Appointment error:", err);
    res.status(500).json({ message: "Failed to book appointment" });
  }
});

/* ==========================
   EXPORT APP (NO listen!)
========================== */
module.exports = app;
