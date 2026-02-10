# Sprint 2 Backend - API Testing Guide

## Quick Start

### Prerequisites
1. Install dependencies: `npm install` in backend directory
2. Ensure MongoDB is running
3. Create `/uploads` directories:
   ```bash
   mkdir -p uploads/documents
   mkdir -p uploads/vendor-documents
   ```
4. Update `.env` with email credentials for QR code functionality

### Environment Variables Required
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
DATABASE_URL=mongodb://localhost:27017/brains704
PORT=5000
```

---

## API Endpoints Reference

### 1. Document Management (Req #76)

#### Upload Document
```
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: x-role: EventsOffice

Body:
- file: <binary file>
- documentType: "tax_card" | "logo" | "vendor_id" | "permit" | "certificate" | "other"
- vendorId: (optional) vendor ObjectId
- bazaarApplicationId: (optional) application ObjectId
- attendeeId: (optional) attendee identifier

Response: 201 Created
{
  "message": "Document uploaded successfully",
  "document": {
    "_id": "...",
    "fileName": "...",
    "documentType": "...",
    "status": "pending",
    "uploadedAt": "..."
  }
}
```

#### Get All Documents (EO/Admin only)
```
GET /api/documents?documentType=tax_card&status=pending&vendorId=...
Authorization: x-role: EventsOffice

Response: 200 OK
[
  {
    "_id": "...",
    "fileName": "...",
    "documentType": "...",
    "status": "pending",
    "uploadedBy": { "firstName": "...", "email": "..." },
    "uploadedAt": "..."
  }
]
```

#### Download Document
```
GET /api/documents/:documentId/download

Response: 200 OK (file download)
```

#### Verify Document
```
PUT /api/documents/:documentId/verify
Authorization: x-role: EventsOffice

Response: 200 OK
{
  "message": "Document verified successfully",
  "document": { ... }
}
```

#### Reject Document
```
PUT /api/documents/:documentId/reject
Authorization: x-role: EventsOffice
Content-Type: application/json

Body:
{
  "rejectionReason": "Document is not clear"
}

Response: 200 OK
```

---

### 2. Polls (Req #82, #83)

#### Create Poll
```
POST /api/polls
Authorization: x-role: EventsOffice
Content-Type: application/json

Body:
{
  "title": "Which booth setup size?",
  "description": "Vote for your preferred booth size",
  "pollType": "vendor_booth_setup",
  "bazaarId": "...",
  "vendorId": "...",
  "options": ["2x2", "4x4"],
  "startDate": "2025-12-01T00:00:00Z",
  "endDate": "2025-12-03T23:59:59Z",
  "allowMultipleVotes": false
}

Response: 201 Created
{
  "message": "Poll created successfully",
  "poll": {
    "_id": "...",
    "title": "Which booth setup size?",
    "status": "active",
    "options": [
      { "optionId": "option_0", "optionText": "2x2", "votes": 0 },
      { "optionId": "option_1", "optionText": "4x4", "votes": 0 }
    ],
    "votes": []
  }
}
```

#### Vote on Poll
```
POST /api/polls/:pollId/vote
Authorization: x-role: Student | Staff | TA | Professor
Content-Type: application/json

Body:
{
  "selectedOption": "option_0"
}

Response: 200 OK
{
  "message": "Vote recorded successfully",
  "poll": { ... }
}
```

#### Get Poll Details
```
GET /api/polls/:pollId

Response: 200 OK
{
  "_id": "...",
  "title": "...",
  "options": [ ... ],
  "votes": [ ... ],
  "status": "active"
}
```

#### List All Polls
```
GET /api/polls?pollType=vendor_booth_setup&status=active&bazaarId=...

Response: 200 OK
[
  { "title": "...", "status": "active", ... },
  ...
]
```

#### Close Poll
```
PUT /api/polls/:pollId/close
Authorization: x-role: EventsOffice

Response: 200 OK
{
  "message": "Poll closed successfully",
  "poll": { "status": "closed", ... }
}
```

---

### 3. Gym Sessions (Req #85, #86)

#### Cancel Gym Session
```
POST /api/gym/:sessionId/cancel
Authorization: x-role: EventsOffice
Content-Type: application/json

Body:
{
  "cancellationReason": "Instructor is unavailable"
}

Response: 200 OK
{
  "message": "Gym session cancelled successfully",
  "session": {
    "_id": "...",
    "type": "yoga",
    "status": "cancelled",
    "cancelledAt": "...",
    "cancellationReason": "..."
  }
}
```

#### Edit Gym Session
```
PUT /api/gym/:sessionId/edit
Authorization: x-role: EventsOffice
Content-Type: application/json

Body:
{
  "date": "2025-12-15T10:00:00Z",
  "time": "10:00 AM",
  "durationMins": 60,
  "type": "yoga",
  "maxParticipants": 30
}

Response: 200 OK
{
  "message": "Gym session updated successfully",
  "session": { ... }
}
```

#### Get Gym Session
```
GET /api/gym/:sessionId

Response: 200 OK
{
  "_id": "...",
  "type": "yoga",
  "date": "...",
  "time": "10:00 AM",
  "durationMins": 60,
  "maxParticipants": 30,
  "status": "published"
}
```

#### List All Gym Sessions
```
GET /api/gym?type=yoga&status=published

Response: 200 OK
[
  { "type": "yoga", "status": "published", ... },
  ...
]
```

---

### 4. Vendor Documents (Req #3, #70, #71)

#### Upload Tax Card or Logo
```
POST /api/vendor-documents/upload
Authorization: x-role: Vendor
Content-Type: multipart/form-data

Body:
- file: <binary file>
- documentType: "taxCard" | "logo"

Response: 200 OK
{
  "message": "taxCard uploaded successfully",
  "vendor": {
    "documents": {
      "taxCard": {
        "fileName": "tax_card.pdf",
        "filePath": "uploads/vendor-documents/...",
        "uploadedAt": "..."
      }
    }
  }
}
```

#### Get Vendor Documents
```
GET /api/vendor-documents/documents
Authorization: x-role: Vendor

Response: 200 OK
{
  "documents": {
    "taxCard": { ... },
    "logo": { ... }
  }
}
```

#### Apply to Loyalty Program
```
POST /api/vendor-documents/loyalty/apply
Authorization: x-role: Vendor

Response: 200 OK
{
  "message": "Successfully enrolled in GUC loyalty program",
  "loyaltyProgram": {
    "isEnrolled": true,
    "enrolledAt": "...",
    "tier": "bronze",
    "points": 0
  }
}
```

#### Cancel Loyalty Program
```
POST /api/vendor-documents/loyalty/cancel
Authorization: x-role: Vendor
Content-Type: application/json

Body:
{
  "reason": "No longer interested"
}

Response: 200 OK
{
  "message": "Successfully cancelled loyalty program participation",
  "loyaltyProgram": {
    "isEnrolled": false,
    "cancelledAt": "...",
    "cancellationReason": "..."
  }
}
```

#### Get Loyalty Status
```
GET /api/vendor-documents/loyalty/status
Authorization: x-role: Vendor

Response: 200 OK
{
  "loyaltyProgram": {
    "isEnrolled": true,
    "tier": "bronze",
    "points": 0
  }
}
```

---

### 5. Workshop Participants (Req #38)

#### View Workshop Participants
```
GET /api/workshops/:workshopId/participants
Authorization: x-role: Professor | Admin

Response: 200 OK
{
  "workshopId": "...",
  "title": "Advanced JavaScript",
  "totalCapacity": 50,
  "registeredCount": 35,
  "remainingSpots": 15,
  "participants": [
    {
      "userId": "...",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "email": "ahmed@example.com",
      "registeredAt": "...",
      "status": "registered"
    }
  ]
}
```

#### Register for Workshop
```
POST /api/workshops/:workshopId/register
Content-Type: application/json

Response: 200 OK
{
  "message": "Successfully registered for workshop"
}
```

#### Unregister from Workshop
```
DELETE /api/workshops/:workshopId/unregister

Response: 200 OK
{
  "message": "Successfully unregistered from workshop"
}
```

#### Mark Participant as Attended
```
PUT /api/workshops/:workshopId/participants/:userId/mark-attended
Authorization: x-role: Professor | Admin

Response: 200 OK
{
  "message": "Participant marked as attended"
}
```

---

### 6. Bazaar QR Codes (Req #62, #66)

#### Send QR Codes to Attendees
```
POST /api/bazaar-qr/:bazaarApplicationId/send-qr-codes
Authorization: x-role: EventsOffice | Admin | Vendor

Response: 200 OK
{
  "message": "QR codes sent successfully",
  "results": [
    {
      "email": "attendee@example.com",
      "status": "sent",
      "qrCode": "data:image/png;base64,..."
    }
  ],
  "successCount": 5,
  "failedCount": 0
}
```

#### Get Bazaar Application QR Codes
```
GET /api/bazaar-qr/:bazaarApplicationId/qr-codes

Response: 200 OK
{
  "bazaarApplicationId": "...",
  "vendor": "Tech Corp",
  "bazaar": "Annual Tech Bazaar 2025",
  "qrCodesSentAt": "...",
  "attendees": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "hasQRCode": true,
      "qrCode": "data:image/png;base64,..."
    }
  ]
}
```

---

## Testing with Postman

### Setup Collections

1. **Create Environment Variables:**
   - `base_url`: `http://localhost:5000/api`
   - `vendor_role`: `Vendor`
   - `eo_role`: `EventsOffice`
   - `student_role`: `Student`

2. **Add to Request Headers:**
   ```
   x-role: {{vendor_role}}
   Content-Type: application/json
   ```

3. **Test File Upload:**
   - Set Content-Type to `multipart/form-data`
   - Add file in Body
   - Add form fields for metadata

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Resource Created |
| 400 | Bad Request |
| 403 | Forbidden (Permission Denied) |
| 404 | Not Found |
| 500 | Server Error |

---

## Error Response Format

```json
{
  "message": "Error description",
  "error": "Additional error details (if available)"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- File uploads are limited by multer configuration (adjust if needed)
- QR codes require valid email configuration in .env
- Workshop registration checks capacity and deadline automatically
- Document verification workflow: pending → verified/rejected
- Poll voting prevents duplicates unless allowMultipleVotes is true