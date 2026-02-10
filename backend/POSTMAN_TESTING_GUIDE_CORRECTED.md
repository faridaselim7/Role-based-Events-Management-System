# CORRECTED Postman Testing Guide - Sprint 2 Requirements
# WITH JWT AUTHENTICATION

## ⚠️ CRITICAL: Your Backend Uses JWT Authentication

Your backend requires **JWT tokens** (not just x-role headers). You must:
1. **Sign up or login first** to get a JWT token
2. **Add the token to every request** in the `Authorization` header
3. Use format: `Bearer <token>`

---

## TABLE OF CONTENTS
1. [Prerequisites & Setup](#prerequisites--setup)
2. [Authentication Flow](#authentication-flow)
3. [Detailed Testing Steps for Each Requirement](#detailed-testing-steps)

---

## Prerequisites & Setup

### ✅ Things to Do BEFORE Testing

#### Step 1: Start MongoDB
- Make sure MongoDB is running on your system
- Check: Open `mongodb://localhost:27017` in browser or check with MongoDB Compass

#### Step 2: Start Backend Server
```bash
cd backend
npm install  # if not done
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5001
```

#### Step 3: Create Test Data in Database
Before testing any endpoint, you need to have test data. There are 2 ways:

**Option A: Sign Up New Users (Recommended)**
You'll do this in Postman as first step

**Option B: Create Data Directly in MongoDB**
Use MongoDB Compass to add test documents

---

## Authentication Flow

### Step 1: Create Postman Environment

1. Open Postman
2. Click **Environments** (left sidebar)
3. Click **+** to create new environment
4. Name it: `Sprint2_JWT`
5. Add these variables:

```
Variable Name          | Initial Value | Current Value
-----------------------|---------------|---------------
base_url              | http://localhost:5001 | 
vendor_token          | (empty)       |
professor_token       | (empty)       |
student_token         | (empty)       |
admin_token           | (empty)       |
vendor_id             | (empty)       |
workshop_id           | (empty)       |
poll_id               | (empty)       |
gym_session_id        | (empty)       |
document_id           | (empty)       |
```

6. Save the environment
7. Select it from top-right dropdown

---

### Step 2: Sign Up a Vendor User

**Purpose:** Get a JWT token for testing vendor endpoints

**Request:**
```
POST http://localhost:5001/api/auth/signup
Method: POST
Body (JSON - raw):
{
  "email": "vendor@test.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "Vendor",
  "companyName": "Tech Corp",
  "role": "Vendor"
}
```

**In Postman:**
1. Create new request
2. Method: **POST**
3. URL: `http://localhost:5001/api/auth/signup`
4. Headers: `Content-Type: application/json`
5. Body: Select **raw** and **JSON**, paste:

```json
{
  "email": "vendor@test.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "Vendor",
  "companyName": "Tech Corp",
  "role": "Vendor"
}
```

6. Click **Send**

**Expected Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "vendor_user_123",
    "email": "vendor@test.com",
    "role": "Vendor",
    "companyName": "Tech Corp"
  }
}
```

**Save Token to Environment:**
1. Click **Tests** tab (at bottom)
2. Add this code:
```javascript
var jsonData = pm.response.json();
pm.environment.set("vendor_token", jsonData.token);
pm.environment.set("vendor_id", jsonData.user._id);
```

3. Click **Send** again
4. The token is now saved! ✅

---

### Step 3: Create Other Test Users

**Sign Up a Professor:**
```
POST http://localhost:5001/api/auth/signup

Body (JSON):
{
  "email": "professor@test.com",
  "password": "password123",
  "firstName": "Dr",
  "lastName": "Professor",
  "studentOrStaffId": "PROF001",
  "role": "Professor"
}
```

**Tests tab code:**
```javascript
var jsonData = pm.response.json();
pm.environment.set("professor_token", jsonData.token);
pm.environment.set("professor_id", jsonData.user._id);
```

**Sign Up a Student:**
```
POST http://localhost:5001/api/auth/signup

Body (JSON):
{
  "email": "student@test.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Student",
  "studentOrStaffId": "50-1234",
  "role": "Student"
}
```

**Tests tab code:**
```javascript
var jsonData = pm.response.json();
pm.environment.set("student_token", jsonData.token);
pm.environment.set("student_id", jsonData.user._id);
```

**Sign Up an EventsOffice User:**
```
POST http://localhost:5001/api/auth/signup

Body (JSON):
{
  "email": "eo@test.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "Office",
  "role": "EventsOffice"
}
```

**Tests tab code:**
```javascript
var jsonData = pm.response.json();
pm.environment.set("eo_token", jsonData.token);
pm.environment.set("eo_id", jsonData.user._id);
```

---

## Detailed Testing Steps

### ✅ TEMPLATE: How to Add JWT Token to Every Request

**For ANY request that needs authentication:**

1. Click **Headers** tab
2. Add header:
   ```
   Key              | Value
   ------------------|------------------------------------------
   Authorization    | Bearer {{vendor_token}}
   ```

3. Replace `{{vendor_token}}` with the appropriate token variable:
   - `{{vendor_token}}` - for vendor endpoints
   - `{{professor_token}}` - for professor endpoints
   - `{{student_token}}` - for student endpoints
   - `{{eo_token}}` - for EventsOffice endpoints

---

## REQ #3: Vendor Uploads Tax Card & Logo

### Prerequisites
- ✅ Vendor account created and token saved (`vendor_token`)
- ✅ Tax card PDF file on your computer
- ✅ Logo PNG/JPG file on your computer

### Step-by-Step: Upload Tax Card

**1. Create Request**
   - Method: **POST**
   - URL: `http://localhost:5001/api/vendor-documents/upload`
   - Name: "Vendor - Upload Tax Card"

**2. Set Headers**
   - Click **Headers** tab
   - Add two headers:
     ```
     Authorization | Bearer {{vendor_token}}
     Content-Type  | multipart/form-data (Postman sets automatically)
     ```

**3. Set Body to form-data**
   - Click **Body** tab
   - Select **form-data** radio button
   - Add two rows:

     | Key           | Type | Value                          |
     |---------------|------|--------------------------------|
     | file          | File | [Select tax_card.pdf from computer] |
     | documentType  | Text | taxCard                        |

**4. Send Request**
   - Click **Send**
   - Look for **Status 201** response

**Expected Success Response:**
```json
{
  "message": "taxCard uploaded successfully",
  "vendor": {
    "_id": "vendor_user_123",
    "email": "vendor@test.com",
    "documents": {
      "taxCard": {
        "fileName": "tax_card.pdf",
        "filePath": "uploads/vendor-documents/1763035774158-tax_card.pdf",
        "uploadedAt": "2024-11-14T10:30:00.000Z"
      }
    }
  }
}
```

**5. Save Tax Card Document ID (if needed later)**
   - Click **Tests** tab
   - Add:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("document_id", jsonData.vendor.documents.taxCard.filePath);
   ```

### Test: Upload Logo

**Repeat the same steps but:**
- Select `logo.png` instead
- Set `documentType: logo`
- Body row 2: `documentType | Text | logo`

**Expected Response:**
```json
{
  "message": "logo uploaded successfully",
  "vendor": {
    "documents": {
      "logo": {
        "fileName": "logo.png",
        "filePath": "uploads/vendor-documents/1763035932890-logo.png"
      }
    }
  }
}
```

### ❌ Troubleshooting REQ #3

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Missing token | Add `Authorization: Bearer {{vendor_token}}` header |
| `No file uploaded` | Using JSON instead of form-data | Select **form-data** in Body tab |
| `Forbidden` | Wrong role | Use vendor token, not student/professor |
| `File path doesn't exist` | File not on computer | Create test PDF file first |

---

## REQ #70: Vendor Applies to Loyalty Program

### Prerequisites
- ✅ Vendor account created and token saved
- ✅ NOT already enrolled in loyalty program

### Step-by-Step

**1. Create Request**
   - Method: **POST**
   - URL: `http://localhost:5001/api/vendor-documents/loyalty/apply`
   - Name: "Vendor - Apply Loyalty Program"

**2. Set Headers**
   - Add header:
     ```
     Authorization | Bearer {{vendor_token}}
     Content-Type  | application/json
     ```

**3. Set Body (JSON)**
   - Click **Body** tab
   - Select **raw**
   - Select **JSON** format
   - Paste:

```json
{
  "discountRate": 15,
  "promoCode": "SUMMER2024",
  "termsAccepted": true
}
```

**4. Send Request**
   - Click **Send**
   - Status should be **200**

**Expected Response:**
```json
{
  "message": "Successfully enrolled in GUC loyalty program",
  "loyaltyProgram": {
    "isEnrolled": true,
    "enrolledAt": "2024-11-14T12:00:00.000Z",
    "tier": "bronze",
    "points": 0,
    "discountRate": 15,
    "promoCode": "SUMMER2024",
    "termsAccepted": true,
    "termsAcceptedAt": "2024-11-14T12:00:00.000Z"
  }
}
```

### Test Cases for REQ #70

**Test Case 2: Missing Required Fields**
```json
{
  "discountRate": 15
}
```
**Expected:** 400 - "Discount rate, promo code, and terms acceptance are required"

**Test Case 3: Invalid Discount Rate (>100)**
```json
{
  "discountRate": 150,
  "promoCode": "TEST",
  "termsAccepted": true
}
```
**Expected:** 400 - "Discount rate must be between 0 and 100"

**Test Case 4: Try Enrolling Again**
Run the first request twice
**Expected on 2nd time:** 400 - "Vendor is already enrolled in the loyalty program"

---

## REQ #71: Vendor Cancels Loyalty Program

### Prerequisites
- ✅ Vendor is already enrolled in loyalty program (do REQ #70 first)

### Step-by-Step

**1. Create Request**
   - Method: **POST**
   - URL: `http://localhost:5001/api/vendor-documents/loyalty/cancel`
   - Name: "Vendor - Cancel Loyalty Program"

**2. Set Headers**
   ```
   Authorization | Bearer {{vendor_token}}
   Content-Type  | application/json
   ```

**3. Set Body (JSON)**

```json
{
  "reason": "Business restructuring"
}
```

**4. Send Request**
   - Click **Send**
   - Status should be **200**

**Expected Response:**
```json
{
  "message": "Successfully cancelled loyalty program participation",
  "loyaltyProgram": {
    "isEnrolled": false,
    "cancelledAt": "2024-11-14T13:00:00.000Z",
    "cancellationReason": "Business restructuring"
  }
}
```

---

## REQ #38: Professor Views Workshop Participants

### Prerequisites
- ✅ Professor account created and token saved
- ✅ Workshop exists in database (or create one)
- ✅ Workshop has participants registered

### Step 1: Create/Get a Workshop

If you have workshop ID, skip to Step 2. Otherwise, check database:
```
MongoDB Compass → Database → workshops → Find a workshop
Copy its _id value
```

### Step 2: Create Request

**1. Setup Request**
   - Method: **GET**
   - URL: `http://localhost:5001/api/workshops/{{workshop_id}}/participants`
   - Name: "Professor - View Workshop Participants"

**2. Set Headers**
   ```
   Authorization | Bearer {{professor_token}}
   Content-Type  | application/json
   ```

**3. Body: (empty)**
   - Leave Body empty for GET request

**4. Send Request**
   - Click **Send**
   - Status should be **200**

**Expected Response:**
```json
{
  "workshopId": "workshop_123",
  "title": "Advanced React",
  "totalCapacity": 30,
  "registeredCount": 22,
  "remainingSpots": 8,
  "participants": [
    {
      "userId": "user_1",
      "firstName": "Ahmed",
      "lastName": "Mohamed",
      "email": "ahmed@guc.edu.eg",
      "studentOrStaffId": "50-1234",
      "registeredAt": "2024-01-10T08:00:00.000Z",
      "status": "registered"
    }
  ]
}
```

### ❌ Troubleshooting REQ #38

| Error | Cause | Solution |
|-------|-------|----------|
| `Workshop not found (404)` | Invalid workshop ID | Get valid ID from MongoDB |
| `You do not have permission (403)` | Wrong role/token | Use professor token |
| `Empty participants array` | No one registered | Add participants to workshop first |

---

## REQ #82: Events Office Creates Poll

### Prerequisites
- ✅ EventsOffice account created and token saved

### Step-by-Step

**1. Create Request**
   - Method: **POST**
   - URL: `http://localhost:5001/api/polls`
   - Name: "EO - Create Poll"

**2. Set Headers**
   ```
   Authorization | Bearer {{eo_token}}
   Content-Type  | application/json
   ```

**3. Set Body (JSON)**

```json
{
  "title": "Which vendor should participate in Tech Bazaar?",
  "description": "Select your preferred vendor for booth setup",
  "pollType": "vendor_booth_setup",
  "options": ["Vendor A", "Vendor B", "Vendor C"],
  "startDate": "2024-11-14T08:00:00Z",
  "endDate": "2024-11-21T23:59:59Z",
  "allowMultipleVotes": false
}
```

**4. Send Request**
   - Status should be **201**

**Expected Response:**
```json
{
  "message": "Poll created successfully",
  "poll": {
    "_id": "poll_123",
    "title": "Which vendor should participate in Tech Bazaar?",
    "options": [
      {"optionId": "option_0", "optionText": "Vendor A", "votes": 0},
      {"optionId": "option_1", "optionText": "Vendor B", "votes": 0},
      {"optionId": "option_2", "optionText": "Vendor C", "votes": 0}
    ],
    "status": "active"
  }
}
```

**5. Save Poll ID**
   - Click **Tests** tab
   - Add:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("poll_id", jsonData.poll._id);
   ```

### Test Cases for REQ #82

**Test Case 2: Missing Options**
```json
{
  "title": "Test Poll"
}
```
**Expected:** 400 - "Title and at least 2 options are required"

**Test Case 3: Less Than 2 Options**
```json
{
  "title": "Test Poll",
  "options": ["Only one option"],
  "startDate": "2024-11-14T00:00:00Z",
  "endDate": "2024-11-21T23:59:59Z"
}
```
**Expected:** 400 - "Title and at least 2 options are required"

---

## REQ #83: User Votes on Poll

### Prerequisites
- ✅ Poll created (do REQ #82 first)
- ✅ Poll is still active
- ✅ Student/Staff/TA/Professor token

### Step-by-Step

**1. Create Request**
   - Method: **POST**
   - URL: `http://localhost:5001/api/polls/{{poll_id}}/vote`
   - Name: "Student - Vote on Poll"

**2. Set Headers**
   ```
   Authorization | Bearer {{student_token}}
   Content-Type  | application/json
   ```

**3. Set Body (JSON)**

```json
{
  "selectedOption": "option_0"
}
```

**4. Send Request**
   - Status should be **200**

**Expected Response:**
```json
{
  "message": "Vote recorded successfully",
  "poll": {
    "options": [
      {"optionId": "option_0", "optionText": "Vendor A", "votes": 1},
      {"optionId": "option_1", "optionText": "Vendor B", "votes": 0}
    ]
  }
}
```

### Test Cases for REQ #83

**Test Case 2: Vote Again (if allowMultipleVotes = false)**
Run the same request twice
**Expected on 2nd time:** 400 - "You have already voted in this poll"

**Test Case 3: Invalid Option**
```json
{
  "selectedOption": "option_999"
}
```
**Expected:** 400 - "Invalid option selected"

---

## REQ #85: Events Office Cancels Gym Session

### Prerequisites
- ✅ EventsOffice token
- ✅ Gym session ID (from database)

### Step-by-Step

**1. Find Gym Session ID**
   - MongoDB Compass → Database → gymsessions → Find document
   - Copy _id

**2. Create Request**
   - Method: **POST**
   - URL: `http://localhost:5001/api/gym/{{gym_session_id}}/cancel`
   - Name: "EO - Cancel Gym Session"

**3. Set Headers**
   ```
   Authorization | Bearer {{eo_token}}
   Content-Type  | application/json
   ```

**4. Set Body (JSON)**

```json
{
  "cancellationReason": "Instructor emergency absence"
}
```

**5. Send Request**
   - Status should be **200**

**Expected Response:**
```json
{
  "message": "Gym session cancelled successfully",
  "session": {
    "_id": "session_123",
    "status": "cancelled",
    "cancelledAt": "2024-11-14T14:00:00.000Z",
    "cancellationReason": "Instructor emergency absence"
  }
}
```

---

## REQ #86: Events Office Edits Gym Session

### Prerequisites
- ✅ EventsOffice token
- ✅ Gym session ID that is NOT cancelled/completed

### Step-by-Step

**1. Create Request**
   - Method: **PUT**
   - URL: `http://localhost:5001/api/gym/{{gym_session_id}}/edit`
   - Name: "EO - Edit Gym Session"

**2. Set Headers**
   ```
   Authorization | Bearer {{eo_token}}
   Content-Type  | application/json
   ```

**3. Set Body (JSON)**

```json
{
  "date": "2024-11-25T10:00:00Z",
  "time": "10:00 AM",
  "durationMins": 75
}
```

**4. Send Request**
   - Status should be **200**

**Expected Response:**
```json
{
  "message": "Gym session updated successfully",
  "session": {
    "_id": "session_123",
    "date": "2024-11-25T10:00:00Z",
    "time": "10:00 AM",
    "durationMins": 75
  }
}
```

### Test: Edit Only One Field

You can also edit just one field:
```json
{
  "time": "11:00 AM"
}
```

---

## REQ #76: Events Office Views/Downloads Documents

### Prerequisites
- ✅ EventsOffice token
- ✅ Documents uploaded (from REQ #3)

### Step 1: Get All Documents

**1. Create Request**
   - Method: **GET**
   - URL: `http://localhost:5001/api/documents`
   - Name: "EO - Get All Documents"

**2. Set Headers**
   ```
   Authorization | Bearer {{eo_token}}
   Content-Type  | application/json
   ```

**3. Body: (empty)**

**4. Send Request**
   - Status should be **200**

**Expected Response:**
```json
[
  {
    "_id": "doc_123",
    "fileName": "tax_card.pdf",
    "filePath": "uploads/documents/1763035774158-tax_card.pdf",
    "documentType": "tax_card",
    "status": "pending",
    "uploadedAt": "2024-11-14T10:30:00.000Z"
  }
]
```

### Step 2: Get Single Document

**1. Create Request**
   - Method: **GET**
   - URL: `http://localhost:5001/api/documents/{{document_id}}`
   - Name: "EO - Get Single Document"

**2. Set Headers**
   ```
   Authorization | Bearer {{eo_token}}
   ```

**3. Send Request**
   - Status should be **200**

### Step 3: Verify Document

**1. Create Request**
   - Method: **PUT**
   - URL: `http://localhost:5001/api/documents/{{document_id}}/verify`
   - Name: "EO - Verify Document"

**2. Set Headers**
   ```
   Authorization | Bearer {{eo_token}}
   Content-Type  | application/json
   ```

**3. Body: (empty JSON)**
   ```json
   {}
   ```

**4. Send Request**
   - Status should be **200**

**Expected Response:**
```json
{
  "message": "Document verified successfully",
  "document": {
    "status": "verified",
    "verifiedAt": "2024-11-14T11:00:00.000Z"
  }
}
```

### Step 4: Reject Document

**1. Create Request**
   - Method: **PUT**
   - URL: `http://localhost:5001/api/documents/{{document_id}}/reject`
   - Name: "EO - Reject Document"

**2. Set Headers & Body**
   ```json
   {
     "rejectionReason": "Document is expired"
   }
   ```

**3. Send Request**
   - Status should be **200**

---

## REQ #66: Vendor Receives QR Codes

### Prerequisites
- ✅ Vendor token
- ✅ Accepted bazaar application ID

### Step-by-Step

**1. Create Request**
   - Method: **POST**
   - URL: `http://localhost:5001/api/bazaar-qr/{{bazaar_app_id}}/send-qr-codes`
   - Name: "Vendor - Send QR Codes"

**2. Set Headers**
   ```
   Authorization | Bearer {{vendor_token}}
   Content-Type  | application/json
   ```

**3. Body: (empty)**
   ```json
   {}
   ```

**4. Send Request**
   - Status should be **200**

**Expected Response:**
```json
{
  "message": "QR codes sent successfully",
  "results": [
    {
      "email": "attendee1@example.com",
      "status": "sent",
      "qrCode": "data:image/png;base64,..."
    }
  ],
  "successCount": 2,
  "failedCount": 0
}
```

---

## COMPLETE TESTING CHECKLIST

Print this and check off each item:

### Phase 1: Setup (Do FIRST)
- [ ] MongoDB is running
- [ ] Backend server running (`npm run dev`)
- [ ] Postman environment "Sprint2_JWT" created
- [ ] All variables added to environment

### Phase 2: Authentication (Do SECOND)
- [ ] Sign up Vendor → Save vendor_token
- [ ] Sign up Professor → Save professor_token
- [ ] Sign up Student → Save student_token
- [ ] Sign up EventsOffice → Save eo_token

### Phase 3: Test Each Requirement
- [ ] REQ #3: Upload Tax Card (201 status)
- [ ] REQ #3: Upload Logo (201 status)
- [ ] REQ #70: Apply Loyalty Program (200 status)
- [ ] REQ #71: Cancel Loyalty Program (200 status)
- [ ] REQ #76: Get All Documents (200 status)
- [ ] REQ #76: Verify Document (200 status)
- [ ] REQ #82: Create Poll (201 status)
- [ ] REQ #83: Vote on Poll (200 status)
- [ ] REQ #85: Cancel Gym Session (200 status)
- [ ] REQ #86: Edit Gym Session (200 status)
- [ ] REQ #38: View Workshop Participants (200 status)
- [ ] REQ #66: Send QR Codes (200 status)

---

## Most Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | No/wrong token | Add `Authorization: Bearer {{token}}` |
| `No token provided` | Authorization header missing | Add header with Bearer token |
| `Invalid token` | Wrong JWT_SECRET or expired token | Get new token from signup |
| `Allowed roles: ...` | Token role doesn't match | Use correct token for role |
| `Cannot read property 'id'` | User not authenticated | Sign up and get token first |
| `Gym session not found` | Wrong session ID | Get ID from MongoDB |
| `Already enrolled` | Vendor already in loyalty program | Use different vendor or cancel first |
| `File not found` | File doesn't exist on computer | Create test file first |

---

## Quick Copy-Paste: Authorization Header

For ANY authenticated endpoint, add this header:
```
Authorization: Bearer {{vendor_token}}
```

Replace `vendor_token` with:
- `{{professor_token}}` for professor endpoints
- `{{student_token}}` for student endpoints
- `{{eo_token}}` for EventsOffice endpoints

