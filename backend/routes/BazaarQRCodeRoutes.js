import express from 'express';
import { sendQRCodesToBazaarAttendees, getBazaarApplicationQRCodes,sendQuizToBoothAttendees } from '../controllers/BazaarQRCodeController.js';
import { requireRole } from '../middleware/requireRole.js';
import { protect } from '../middleware/protect.js'; // ADD THIS
import { sendAllQRCodesToVendor } from '../controllers/BazaarQRCodeController.js';

const router = express.Router();

// Req #62 & #66 - Send QR codes to registered visitors via email
 router.post('/:bazaarApplicationId/send-qr-codes', protect, requireRole('eventsoffice', 'admin', 'vendor'), sendQRCodesToBazaarAttendees);
 router.post('/:boothApplicationId/send-q-codes', protect, requireRole('eventsoffice', 'admin', 'vendor'), sendQuizToBoothAttendees);

// Get bazaar application QR codes
router.get('/:bazaarApplicationId/qr-codes', protect, getBazaarApplicationQRCodes);
router.post('/send-to-vendor/:applicationId', protect, sendAllQRCodesToVendor);

export default router;