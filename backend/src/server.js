// backend/src/server.js
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import fs from "fs";
import { fileURLToPath } from "url";

import vendorRoutes from "../routes/vendorRoutes.js";
import eventRoutes from "../routes/eventRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import adminRoutes from "../routes/AdminRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import CourtRoutes from "../routes/CourtRoutes.js";
import GymRoutes from "../routes/GymRoutes.js";
import professorRoutes from "../routes/professorRoutes.js";
import RegistrationRoutes from "../routes/RegistrationRoutes.js";
import PaymentRoutes from "../routes/PaymentRoutes.js";
import EO_conferenceRoutes from "../routes/EO_conferenceRoutes.js";
import EO_workshopRoutes from "../routes/EO_workshopRoutes.js";

// Sprint 2
import DocumentRoutes from "../routes/DocumentRoutes.js";
import PollRoutes from "../routes/PollRoutes.js";
import VendorDocumentRoutes from "../routes/VendorDocumentRoutes.js";
import WorkshopParticipantRoutes from "../routes/WorkshopParticipantRoutes.js";
import BazaarQRCodeRoutes from "../routes/BazaarQRCodeRoutes.js";
import EO_notificationRoutes from "../routes/EO_notificationRoutes.js";
import notificationRoutes from "../routes/notificationRoutes.js";
import loyaltyRoutes from "../routes/loyaltyRoutes.js";

import boothRecommendationRoutes from "../routes/boothRecommendationRoutes.js"; // adjust path if needed


import lostItemRoutes from "../routes/lostItemRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", " http://172.20.10.12:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-role"],
    credentials: true,
  })
);
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing. Create a .env in /backend with MONGO_URI.");
  process.exit(1);
}

// mask user/pass for logs
const masked = process.env.MONGO_URI.replace(/(mongodb(\+srv)?:\/\/)(.*?)(@)/, (_, p1, _p2, _creds, p4) => `${p1}***:***${p4}`);
console.log("🔐 Using MONGO_URI:", masked);


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    console.log("📘 Database:", mongoose.connection.name);
    console.log("📁 Collections:", Object.keys(mongoose.connection.collections));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes (REGISTER BEFORE listen)
app.get("/", (req, res) => res.send("Backend API is running ✅"));
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/User", userRoutes);
app.use("/api/Court", CourtRoutes);
app.use("/api/GymSession", GymRoutes);
app.use("/api/registrations", RegistrationRoutes);
app.use("/api/payments", PaymentRoutes);
app.use("/api/eo", EO_conferenceRoutes);
app.use("/api/eo", EO_workshopRoutes);
app.use("/api/professor", professorRoutes);
app.use("/api/documents", DocumentRoutes);
app.use("/api/polls", PollRoutes);
app.use("/api/gym", GymRoutes);
app.use("/api/vendor-documents", VendorDocumentRoutes);
app.use("/api/workshops", WorkshopParticipantRoutes);
app.use("/api/bazaar-qr", BazaarQRCodeRoutes);
app.use("/api/eo", EO_notificationRoutes);
app.use("/api", notificationRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use('/api/vendors/qr', BazaarQRCodeRoutes);

app.use("/api/lost-items", lostItemRoutes);

// ADMIN ROUTES (final unified path)
app.use("/api/admin", adminRoutes);

// Debug list
app.get("/api/endpoints", (req, res) => res.json(listEndpoints(app)));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.use("/api/booths", boothRecommendationRoutes);
