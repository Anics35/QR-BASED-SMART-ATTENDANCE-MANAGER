// index.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require("./routes/sessionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const courseRoutes = require("./routes/courseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const adminRoutes = require("./routes/adminRoutes"); // <--- Import


const app = express();
connectDB();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));


app.use('/auth', authRoutes);
app.use("/session", sessionRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/course", courseRoutes);
app.use("/report", reportRoutes);
app.use("/logs", auditLogRoutes);
app.use("/admin", adminRoutes); // <--- Add Route


app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
