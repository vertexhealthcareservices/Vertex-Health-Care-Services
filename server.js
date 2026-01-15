// ==========================
// LOAD ENV VARIABLES
// ==========================
const nodemailer = require("nodemailer");


const path = require("path");
require("dotenv").config();
console.log("ADMIN_USERNAME =", process.env.ADMIN_USERNAME);
console.log("ADMIN_PASSWORD =", process.env.ADMIN_PASSWORD);

// ==========================
// IMPORT PACKAGES
// ==========================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// ==========================
// INITIALIZE APP
// ==========================
const app = express();

// ==========================
// GLOBAL MIDDLEWARE
// ==========================
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true after HTTPS
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

app.use(morgan("combined"));
app.use(cors());

// ==========================
// RATE LIMITING
// ==========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// ==========================
// STATIC FILES
// ==========================
app.use(express.static(path.join(__dirname, "public")));

// ==========================
// TEST ROUTE
// ==========================
app.get("/test", (req, res) => {
  res.send("TEST ROUTE WORKS");
});

// ==========================
// ROOT ROUTE
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================
// MONGODB CONNECTION
// ==========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Vertex Database Connected Successfully!"))
  .catch((err) => console.error("❌ Database Connection Error:", err));

// ==========================
// APPOINTMENT SCHEMA
// ==========================
const appointmentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, minlength: 10, maxlength: 15 },
    emailAddress: { type: String, trim: true },
    department: { type: String, required: true },
    doctorName: { type: String, trim: true },
    reasonForVisit: { type: String, trim: true },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

// ==========================
// ADMIN AUTH MIDDLEWARE
// ==========================
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.status(401).json({ message: "Unauthorized" });
}

// ==========================
// ADMIN LOGIN
// ==========================
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.isAdmin = true;
    return res.json({ message: "Login successful" });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// ==========================
// ADMIN LOGOUT
// ==========================
app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// ==========================
// PROTECTED ADMIN PAGE
// ==========================
app.get("/admin.html", (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect("/admin_login.html");
  }
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ==========================
// CREATE APPOINTMENT (PUBLIC)
// ==========================
app.post("/api/appointments", async (req, res) => {
  try {
    console.log("📌 Appointment request received");

    const { fullName, mobileNumber, department } = req.body;

    if (!fullName || !mobileNumber || !department) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // 1. Save appointment
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    console.log("✅ Appointment saved to database");

    // 2. Send email to admin from user's email
    console.log("📧 Sending email to admin...");

    await transporter.sendMail({
      from: `"${req.body.fullName}" <${process.env.EMAIL_USER}>`, // From admin account but show user's name
      replyTo: req.body.emailAddress || process.env.EMAIL_USER, // Reply goes to user's email
      to: process.env.EMAIL_USER, // admin inbox
      subject: "🩺 New Appointment Booked - " + req.body.fullName,
      text: `
New Appointment Details:

Name: ${req.body.fullName}
Mobile: ${req.body.mobileNumber}
Email: ${req.body.emailAddress || "N/A"}
Department: ${req.body.department}
Doctor: ${req.body.doctorName || "Not specified"}
Reason: ${req.body.reasonForVisit}

Booked At: ${new Date().toLocaleString()}

---
Reply to this email to contact the patient directly.
      `,
    });

    console.log("📨 Email sent successfully");

    // 3. Respond to frontend
    res.status(201).json({ message: "Appointment booked successfully!" });
  } catch (err) {
    console.error("❌ Appointment error:", err);
    res.status(500).json({ error: "Server failed to save appointment" });
  }
});

// ==========================
// GET APPOINTMENTS (ADMIN)
// ==========================
app.get("/api/appointments", requireAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// ==========================
// UPDATE STATUS (ADMIN)
// ==========================
app.patch("/api/appointments/:id", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await Appointment.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📱 Access from phone: http://YOUR_LOCAL_IP:${PORT}`);
});
