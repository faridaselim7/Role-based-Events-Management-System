import express from 'express';
import multer from 'multer';
import { uploadDocument, getAllDocuments, getDocument, downloadDocument, verifyDocument, rejectDocument, deleteDocument } from '../controllers/DocumentController.js';
import { requireRole } from '../middleware/requireRole.js';
import { protect } from "../middleware/protect.js";  // ADD THIS
import { viewDocument } from '../controllers/DocumentController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Req #76 - Upload document
router.post('/upload', protect, upload.single('file'), uploadDocument);

// Req #76 - Get all documents (EO/Admin only)
router.get('/', protect, requireRole('events_office', 'admin'), getAllDocuments);

// Get single document
router.get('/:documentId', getDocument);

// Req #76 - Download document
router.get('/:documentId/download', downloadDocument);

// Verify document (EO/Admin only)
router.put('/:documentId/verify', requireRole('events_office', 'admin'), verifyDocument);

// Reject document (EO/Admin only)
router.put('/:documentId/reject', requireRole('events_office', 'admin'), rejectDocument);

// Delete document (EO/Admin only)
router.delete('/:documentId', requireRole('events_office', 'admin'), deleteDocument);

// BEST VERSION (recommended)
router.get('/:documentId/view', protect, viewDocument);

export default router;