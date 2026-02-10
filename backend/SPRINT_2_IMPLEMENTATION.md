# Sprint 2 Backend Implementation Summary

## Overview
This document summarizes all the backend implementations for Sprint 2 requirements. All changes are backend-only with no frontend modifications.

---

## Implemented Requirements

### 1. Req #3 - Vendor uploads tax card and logo
**Model Updates:** Vendor.js
- Added `documents` object with `taxCard` and `logo` fields
- Each document stores: fileName, filePath, uploadedAt

**Controller:** VendorDocumentController.js
- `uploadVendorDocuments()` - Upload tax card or logo with file validation

**Route:** VendorDocumentRoutes.js
- `POST /vendor/upload` - Upload document (requires Vendor role)
- `GET /vendor/documents` - Get vendor's documents

---

### 2. Req #62 - Vendor uploads IDs of individuals attending bazaar/booth
**Model Updates:** BazaarApplication.js
- Added `id` object to attendees with: fileName, filePath, uploadedAt
- Attendees can now have ID documents attached

**Controller:** DocumentController.js
- `uploadDocument()` - Upload attendee ID documents
- `getDocument()` - Retrieve specific document

**Route:** DocumentRoutes.js
- `POST /documents/upload` - Upload ID document
- `GET /documents/:documentId` - Get document details

---

### 3. Req #66 - Vendor receives QR codes for registered visitors via email
**Model Updates:** BazaarApplication.js
- Added `qrCode` field to attendees
- Added `qrCodesSentAt` timestamp

**Service:** qrCodeService.js
- `generateQRCode()` - Generate QR code with attendee info
- `sendQRCodeEmail()` - Send QR code via email using nodemailer
- `sendQRCodesToAttendees()` - Batch send QR codes

**Controller:** BazaarQRCodeController.js
- `sendQRCodesToBazaarAttendees()` - Trigger QR code sending
- `getBazaarApplicationQRCodes()` - Retrieve sent QR codes

**Route:** BazaarQRCodeRoutes.js
- `POST /bazaar-qr/:bazaarApplicationId/send-qr-codes` - Send QR codes
- `GET /bazaar-qr/:bazaarApplicationId/qr-codes` - Get QR codes

---

### 4. Req #38 - Professor views workshop participants list and remaining spots
**Model Updates:** Workshop.js
- Added `participants` array with userId, registeredAt, status fields
- Added virtual `remainingSpots` property (capacity - participants.length)

**Controller:** WorkshopParticipantController.js
- `getWorkshopParticipants()` - Get participant list with capacity info
- `registerForWorkshop()` - Register user for workshop
- `unregisterFromWorkshop()` - Remove participant
- `markParticipantAttended()` - Mark participant as attended

**Route:** WorkshopParticipantRoutes.js
- `GET /workshops/:workshopId/participants` - View participants (Professor/Admin only)
- `POST /workshops/:workshopId/register` - Register for workshop
- `DELETE /workshops/:workshopId/unregister` - Unregister from workshop
- `PUT /workshops/:workshopId/participants/:userId/mark-attended` - Mark attendance

---

### 5. Req #76 - Events Office/Admin views/downloads uploaded documents
**Model Created:** Document.js
- Tracks all uploaded documents with metadata
- Fields: fileName, filePath, documentType, vendorId, uploadedBy, fileSize, mimeType, status, verificationFields

**Controller:** DocumentController.js
- `uploadDocument()` - Upload document with file storage
- `getAllDocuments()` - List all documents with filters (EO/Admin only)
- `getDocument()` - Get document details
- `downloadDocument()` - Download file
- `verifyDocument()` - Mark document as verified
- `rejectDocument()` - Reject with reason
- `deleteDocument()` - Delete document and file

**Route:** DocumentRoutes.js
- `POST /documents/upload` - Upload document
- `GET /documents` - List documents (EO/Admin only)
- `GET /documents/:documentId` - Get document
- `GET /documents/:documentId/download` - Download file
- `PUT /documents/:documentId/verify` - Verify document
- `PUT /documents/:documentId/reject` - Reject document
- `DELETE /documents/:documentId` - Delete document

---

### 6. Req #82 - Events Office creates poll for vendor booth setup
**Model Created:** Poll.js
- Fields: title, description, pollType, vendorId, bazaarId, options, votes, createdBy, dates, status

**Controller:** PollController.js
- `createPoll()` - Create new poll (EO/Admin only)
- `getAllPolls()` - List polls with filters
- `getPoll()` - Get poll details
- `closePoll()` - Close poll (EO/Admin only)

**Route:** PollRoutes.js
- `POST /polls` - Create poll (EO/Admin only)
- `GET /polls` - List polls
- `GET /polls/:pollId` - Get poll details
- `PUT /polls/:pollId/close` - Close poll

---

### 7. Req #83 - Student/Staff/TA/Professor votes for vendor in poll
**Controller:** PollController.js
- `votePoll()` - Record vote in poll
- Prevents duplicate votes (unless allowMultipleVotes is true)
- Updates vote counts automatically

**Route:** PollRoutes.js
- `POST /polls/:pollId/vote` - Vote on poll (Student/Staff/TA/Professor only)

---

### 8. Req #85 - Events Office cancels gym session
**Model Updates:** GymSession.js
- Added `status` enum: ['published', 'cancelled', 'completed']
- Added: cancelledAt, cancellationReason, cancelledBy fields

**Controller:** GymController.js
- `cancelGymSession()` - Cancel session with optional reason

**Route:** GymRoutes.js
- `POST /gym/:sessionId/cancel` - Cancel gym session (EO/Admin only)

---

### 9. Req #86 - Events Office edits gym session (date/time/duration)
**Controller:** GymController.js
- `editGymSession()` - Edit date, time, duration, type, maxParticipants
- Prevents editing cancelled/completed sessions

**Route:** GymRoutes.js
- `PUT /gym/:sessionId/edit` - Edit gym session (EO/Admin only)

---

### 10. Req #70 - Vendor applies to GUC loyalty program with form
**Model Updates:** Vendor.js
- Added `loyaltyProgram` object with: isEnrolled, enrolledAt, tier, points

**Controller:** VendorDocumentController.js
- `applyLoyaltyProgram()` - Enroll in loyalty program

**Route:** VendorDocumentRoutes.js
- `POST /vendor/loyalty/apply` - Apply to loyalty program (Vendor only)

---

### 11. Req #71 - Vendor cancels participation in GUC loyalty program
**Controller:** VendorDocumentController.js
- `cancelLoyaltyProgram()` - Cancel enrollment with optional reason
- `getLoyaltyProgramStatus()` - Get loyalty program status

**Route:** VendorDocumentRoutes.js
- `POST /vendor/loyalty/cancel` - Cancel loyalty program (Vendor only)
- `GET /vendor/loyalty/status` - Check loyalty status

---

## Dependencies Added

**package.json Updates:**
- `multer@^1.4.5-lts.1` - File upload handling
- `qrcode@^1.5.3` - QR code generation

**To install:** Run `npm install` in the backend directory

---

## File Upload Configuration

Created directories for uploads (must be created manually or via code):
- `/uploads/documents/` - General documents
- `/uploads/vendor-documents/` - Vendor-specific documents

Multer is configured with disk storage and automatic filename generation using timestamps.

---

## Authentication & Authorization

All endpoints use the `requireRole` middleware for authorization:
- **EventsOffice/Admin:** Document management, gym session management, poll creation
- **Vendor:** Document uploads, loyalty program management
- **Student/Staff/TA/Professor:** Poll voting, workshop registration

---

## Environment Variables Required

For QR code email functionality:
- `EMAIL_SERVICE` - Email service provider (default: gmail)
- `EMAIL_USER` - Email account username
- `EMAIL_PASSWORD` - Email account password

---

## API Endpoint Summary

| Requirement | Method | Endpoint | Auth Role |
|-------------|--------|----------|-----------|
| #3 | POST | /vendor/upload | Vendor |
| #62 | POST | /documents/upload | Any |
| #66 | POST | /bazaar-qr/:id/send-qr-codes | EO/Admin/Vendor |
| #38 | GET | /workshops/:id/participants | Professor/Admin |
| #76 | GET | /documents | EO/Admin |
| #82 | POST | /polls | EO/Admin |
| #83 | POST | /polls/:id/vote | Student/Staff/TA/Prof |
| #85 | POST | /gym/:id/cancel | EO/Admin |
| #86 | PUT | /gym/:id/edit | EO/Admin |
| #70 | POST | /vendor/loyalty/apply | Vendor |
| #71 | POST | /vendor/loyalty/cancel | Vendor |

---

## Next Steps

1. **Mount routes in main server file (app.js or server.js):**
   - Import all route files
   - Add `app.use('/api/documents', DocumentRoutes)`
   - Add `app.use('/api/polls', PollRoutes)`
   - Add all other routes

2. **Create upload directories:**
   - Ensure `/uploads/documents/` exists
   - Ensure `/uploads/vendor-documents/` exists

3. **Update .env file:**
   - Add email configuration for QR code sending

4. **Test endpoints:**
   - Use Postman or similar tool to test all endpoints
   - Verify file uploads work correctly
   - Test email sending for QR codes

5. **Frontend Integration:**
   - Create API calls to these new endpoints
   - Add UI components for document upload
   - Add poll voting interface
   - Add gym session management UI