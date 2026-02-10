import express from 'express';
import multer from 'multer';
import { 
  uploadVendorDocuments, 
  getVendorDocuments, 
  applyLoyaltyProgram, 
  cancelLoyaltyProgram, 
  getLoyaltyProgramStatus,
  uploadAttendeeId 
} from '../controllers/VendorDocumentController.js';
import { requireRole } from '../middleware/requireRole.js';
import { protect } from "../middleware/protect.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/vendor-documents/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ===== DOCUMENT UPLOAD ROUTES =====
// POST /api/vendor-documents/upload (mounted at /api/vendor-documents in server.js)
router.post(
  "/upload",
  protect,
  requireRole(["Vendor"]),
  upload.single("file"),
  uploadVendorDocuments
);

// ✅ FIX: GET /api/vendor-documents/documents (no vendorId param needed)
router.get(
  '/documents',
  protect,
  requireRole(['Vendor']),
  getVendorDocuments
);

// ===== LEGACY ROUTES (keep for backwards compatibility) =====
router.post(
  "/upload",
  protect,
  requireRole(["Vendor"]),
  upload.single("file"),
  uploadVendorDocuments
);

// REQ #62 - Vendor uploads attendee ID (after acceptance)
router.post(
  "/upload-attendee-id",
  protect,
  requireRole(["Vendor"]),
  upload.single("file"),
  uploadAttendeeId
);

// ===== LOYALTY PROGRAM ROUTES =====
// Req #70 - Vendor applies to GUC loyalty program
router.post('/loyalty/apply', protect, requireRole(['Vendor']), applyLoyaltyProgram);

// Req #71 - Vendor cancels participation in GUC loyalty program
router.post('/loyalty/cancel', protect, requireRole(['Vendor']), cancelLoyaltyProgram);

// Get loyalty program status
router.get('/loyalty/status', protect, requireRole(['Vendor']), getLoyaltyProgramStatus);

export default router;