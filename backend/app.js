// backend/app.js
import express from "express";
import morgan from "morgan";
import cors from "cors";

import professorRoutes from "./routes/professorRoutes.js";
import EO_workshopRoutes from "./routes/EO_workshopRoutes.js";
import EO_conferenceRoutes from "./routes/EO_conferenceRoutes.js";
import eventsRoutes from "./routes/eventRoutes.js"; // ESM path with .js
import vendorRoutes from "./routes/vendorRoutes.js";

// Sprint 2 Routes
import DocumentRoutes from "./routes/DocumentRoutes.js";
import PollRoutes from "./routes/PollRoutes.js";
import GymRoutes from "./routes/GymRoutes.js";
import VendorDocumentRoutes from "./routes/VendorDocumentRoutes.js";
import WorkshopParticipantRoutes from "./routes/WorkshopParticipantRoutes.js";
import BazaarQRCodeRoutes from "./routes/BazaarQRCodeRoutes.js";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use("/api/vendors", vendorRoutes);

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Mount all routers
app.use("/api/professor", professorRoutes);
app.use("/api/eo", EO_workshopRoutes);
app.use("/api/eo", EO_conferenceRoutes);
app.use("/api/events", eventsRoutes); // ✅ mount AFTER app is created

// Sprint 2 Routes
app.use("/api/documents", DocumentRoutes);
app.use("/api/polls", PollRoutes);
app.use("/api/gym", GymRoutes);
app.use("/api/vendor-documents", VendorDocumentRoutes);
app.use("/api/workshops", WorkshopParticipantRoutes);
app.use("/api/bazaar-qr", BazaarQRCodeRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server Error" });
});

export default app;
