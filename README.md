# 🧠 Brains704 - University Campus Management System

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)

A comprehensive full-stack web application for managing university campus activities, events, vendor management, and facility bookings. Built with **Express.js**, **MongoDB**, and **React** for the Habiba GUC university community.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Database Models](#database-models)
- [Authentication & Authorization](#authentication--authorization)
- [Design System](#design-system)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Team](#team)

---

## 🎯 Overview

**Brains704** is a sophisticated campus management platform designed to streamline operations for GUC (German University in Cairo). The system provides integrated solutions for:

- **Event Management** - Create, manage, and track university events
- **Workshop Management** - Organize workshops with participant tracking
- **Vendor Management** - Handle vendor applications, documents, and loyalty programs
- **Facility Booking** - Manage gym sessions, courts, and other facilities
- **Polling System** - Enable community voting on important decisions
- **Document Management** - Handle uploads, verification, and storage
- **User Registration** - Manage student, staff, and vendor registrations
- **Bazaar Management** - Coordinate bazaar events with QR code tracking

---

## ✨ Key Features

### 👥 User Management
- **Multi-role authentication** (Student, Staff, TA, Professor, Vendor, Events Office, Admin)
- JWT-based session management with refresh tokens
- Role-based access control (RBAC)
- User profile management and updates

### 📅 Events & Workshops
- Create and manage university events with capacity tracking
- Workshop scheduling with automatic participant capacity calculation
- Real-time availability status
- Event ratings and feedback system
- Participant registration and attendance tracking

### 🤝 Vendor Management
- Vendor application and verification workflow
- Tax card and logo document uploads
- Loyalty program enrollment and management
- Document verification by Events Office
- Vendor performance tracking

### 🎪 Facility Management
- **Gym Sessions** - Schedule, edit, and cancel with refund management
- **Courts** - Book facility courts with availability checking
- **Bazaar Management** - Coordinate vendor booths with QR code attendance tracking
- Real-time capacity updates

### 🗳️ Polling System
- Events Office creates vendor selection polls
- Students, Staff, TAs, and Professors vote on options
- Real-time vote counting with progress visualization
- Leading vendor highlighting
- Poll status tracking

### 📄 Document Management
- Secure document upload and storage
- Multi-file support (images, PDFs, Excel)
- Document verification workflow
- Download and access tracking

### 💳 Payment Integration
- Stripe payment processing
- Transaction history tracking
- Payment status monitoring

### 📧 Notifications
- Email notifications for event updates
- QR code delivery via email
- Automated alerts for registrations
- SendGrid integration for reliability

---

## 🛠️ Technology Stack

### Backend
```
Express.js 4.18.2       - REST API framework
MongoDB 6.3.0          - NoSQL database
Mongoose 6.11.2        - MongoDB ODM
Node.js 18+            - JavaScript runtime
JWT 9.0.2              - Authentication
Stripe 19.3.1          - Payment processing
SendGrid 8.1.6         - Email service
Multer 1.4.5           - File uploads
QRCode 1.5.3           - QR code generation
Nodemailer 7.0.9       - Email sending
```

### Frontend
```
React 19.2.0           - UI framework
React Router 7.9.3     - Client-side routing
Tailwind CSS 3.4.18    - Utility-first CSS
Lucide React 0.487     - Icon library
Heroicons 2.2.0        - Premium icons
Chart.js 4.5.1         - Data visualization
Stripe React 5.4.0     - Payment UI
Axios 1.12.2           - HTTP client
Zustand 5.0.8          - State management
React Hot Toast 2.6.0  - Toast notifications
Sonner 2.0.3           - Modern toasts
```

---

## 📁 Project Structure

```
Brains704/
├── backend/
│   ├── config/
│   │   ├── db.js                    # Database configuration
│   │   └── multerConfig.js          # File upload configuration
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── eventController.js       # Event management
│   │   ├── PollController.js        # Polling system
│   │   ├── GymController.js         # Facility management
│   │   ├── DocumentController.js    # Document handling
│   │   ├── WorkshopParticipantController.js
│   │   └── [other controllers]
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Event.js                 # Event schema
│   │   ├── Workshop.js              # Workshop schema
│   │   ├── Poll.js                  # Poll schema
│   │   ├── Vendor.js                # Vendor schema
│   │   ├── Document.js              # Document schema
│   │   └── [other models]
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── PollRoutes.js
│   │   ├── GymRoutes.js
│   │   └── [other routes]
│   ├── middleware/
│   │   ├── protect.js               # JWT verification
│   │   ├── requireRole.js           # Role checking
│   │   └── requireEventsOffice.js
│   ├── services/
│   │   └── qrCodeService.js         # QR code generation
│   ├── uploads/                     # File storage directory
│   ├── app.js                       # Express app setup
│   ├── package.json
│   └── src/server.js                # Server entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── events-office/       # EO-specific components
│   │   │   │   ├── BoothSetupPoll.jsx
│   │   │   │   ├── GymSessionEditor.jsx
│   │   │   │   └── GymSessionCancellation.jsx
│   │   │   ├── LoadingEmptyStates.jsx
│   │   │   └── [other components]
│   │   ├── pages/
│   │   │   ├── EventRegistration.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── GymSchedule.jsx
│   │   │   └── [other pages]
│   │   ├── styles/
│   │   │   └── EOdesignSystem.js    # Design tokens & theme
│   │   ├── services/
│   │   │   └── api.js              # API client
│   │   ├── hooks/
│   │   ├── stores/                 # Zustand stores
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
│
├── package.json                     # Root dependencies
├── README.md                        # This file
└── PROJECT_REQUIREMENTS.xlsx        # Specifications
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **MongoDB** 5.0+ ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** for version control
- A **code editor** (VS Code recommended)
- **Postman** (optional, for API testing)

### System Requirements
- **OS**: Windows, macOS, or Linux
- **RAM**: 4GB minimum
- **Disk Space**: 2GB minimum
- **Internet Connection**: Required for npm packages and external APIs

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Brains704.git
cd Brains704
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Install Root Dependencies

```bash
cd ..
npm install
```

---

## 🔧 Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/brains704
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_HOST>/<DB_NAME>

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# SendGrid Email
SENDGRID_API_KEY=your_sendgrid_api_key

# Email Configuration (Alternative to SendGrid)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Google APIs (for calendar integration if needed)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

### Important Notes
- ⚠️ **Never commit `.env` files** - they contain sensitive information
- 🔐 For production, use secure secret management tools (e.g., AWS Secrets Manager, HashiCorp Vault)
- 🔑 Generate strong JWT secrets: use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- 📧 For Gmail, enable "Less Secure App Access" or use App Passwords
- 💳 Get Stripe keys from your [Stripe Dashboard](https://dashboard.stripe.com/)

---

## ▶️ Running the Application

### Development Mode

#### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
✅ Server running on http://localhost:5001
✅ MongoDB connected
```

#### Terminal 2 - Frontend Development Server

```bash
cd frontend
npm start
```

Expected output:
```
✅ Compiled successfully!
Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd ../backend
NODE_ENV=production npm start
```

### Health Check

Test that the server is running:

```bash
curl http://localhost:5001/api/health
# Response: { "ok": true }
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Include the user role header for role-based access:

```
x-role: <role>  # student, staff, professor, vendor, events_office, admin
```

### Main API Endpoints

#### Authentication
```
POST   /auth/register           # Register new user
POST   /auth/login              # User login
POST   /auth/refresh-token      # Refresh JWT token
POST   /auth/logout             # Logout user
GET    /auth/me                 # Get current user
```

#### Events
```
GET    /events                  # List all events
POST   /events                  # Create event (Admin/EO)
GET    /events/:id              # Get event details
PUT    /events/:id              # Update event (Admin/EO)
DELETE /events/:id              # Delete event (Admin/EO)
GET    /events/:id/registrations # Get event registrations
POST   /events/:id/register     # Register for event
```

#### Workshops
```
GET    /eo/workshops                       # List workshops
POST   /eo/workshops                       # Create workshop
GET    /eo/workshops/:id                   # Get workshop details
PUT    /eo/workshops/:id                   # Update workshop
DELETE /eo/workshops/:id                   # Delete workshop
GET    /workshops/:workshopId/participants # Get participants
```

#### Polls
```
GET    /polls                     # List all polls
POST   /polls                     # Create poll (EO only)
GET    /polls/:pollId             # Get poll details
POST   /polls/:pollId/vote        # Vote on poll
PUT    /polls/:pollId             # Update poll status
DELETE /polls/:pollId             # Delete poll (EO)
```

#### Gym Sessions
```
GET    /gym/sessions              # List sessions
POST   /gym/sessions              # Create session (EO)
GET    /gym/sessions/:id          # Get session details
PUT    /gym/sessions/:id          # Update session
DELETE /gym/sessions/:id          # Cancel session
POST   /gym/sessions/:id/register # Register for session
```

#### Vendor Management
```
GET    /vendors                   # List vendors
POST   /vendors                   # Register as vendor
GET    /vendors/:id               # Get vendor details
PUT    /vendors/:id               # Update vendor profile
POST   /vendors/:id/documents     # Upload documents
GET    /vendors/:id/documents     # Get vendor documents
```

#### Documents
```
GET    /documents                 # List documents (Admin/EO)
POST   /documents                 # Upload document
GET    /documents/:id             # Download document
PUT    /documents/:id/verify      # Verify document (EO)
PUT    /documents/:id/reject      # Reject document (EO)
```

For complete API reference, see [API_TESTING_GUIDE.md](backend/API_TESTING_GUIDE.md)

---

## 🎨 Frontend Features

### Components Library

#### Events Office Design System
The frontend includes a comprehensive design system (`EOdesignSystem.js`) featuring:

**Color Palette:**
- 🟢 **Mughal Green** (#366B2B) - Primary actions
- 🔵 **Prussian Blue** (#103A57) - Main text and headings
- 🟦 **Teal** (#307B8E) - Secondary accents
- ⭐ **Citron** (#E8F442) - Alerts and urgent actions
- 💜 **Tyrian Purple** (#6F2DA8) - Premium highlights

**Components:**
- Buttons (primary, secondary, danger, ghost variants)
- Form inputs with validation states
- Cards with shadows and hover effects
- Alert components (success, error, warning, info)
- Badges for status indicators
- Loading skeletons
- Empty states

**Animations:**
- Smooth transitions and fade effects
- Hover lift animations
- Slide and scale transforms
- Loading spinners

### Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/login` | User authentication |
| Sign Up | `/signup` | User registration |
| Dashboard | `/dashboard` | Main hub for user |
| Events | `/events` | Browse and register for events |
| Workshops | `/workshops` | Workshop management |
| Gym Schedule | `/gym-schedule` | Facility booking |
| Polls | `/polls` | Voting interface |
| Vendor Dashboard | `/vendor/dashboard` | Vendor management |
| Events Office | `/events-office` | Admin controls |

---

## 🗄️ Database Models

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['student', 'staff', 'professor', 'vendor', 'events_office', 'admin'],
  studentOrStaffId: String,
  phone: String,
  dateOfBirth: Date,
  department: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model
```javascript
{
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  location: String,
  capacity: Number,
  registeredCount: Number,
  status: Enum ['upcoming', 'ongoing', 'completed', 'cancelled'],
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Workshop Model
```javascript
{
  title: String,
  description: String,
  date: Date,
  location: String,
  professor: ObjectId (User),
  totalCapacity: Number,
  registeredCount: Number,
  remainingSpots: Number (virtual),
  participants: [{
    userId: ObjectId,
    status: Enum ['registered', 'attended'],
    registeredAt: Date
  }],
  createdAt: Date
}
```

### Poll Model
```javascript
{
  title: String,
  description: String,
  pollType: String,
  options: [{
    optionId: ObjectId,
    optionText: String,
    votes: Number
  }],
  status: Enum ['active', 'closed'],
  votes: [{
    userId: ObjectId,
    selectedOption: ObjectId,
    votedAt: Date
  }],
  startDate: Date,
  endDate: Date,
  createdBy: ObjectId,
  createdAt: Date
}
```

For complete model documentation, see the [backend/models/](backend/models/) directory.

---

## 🔐 Authentication & Authorization

### JWT Flow

1. **Login**: User sends credentials → Server validates → Returns JWT + Refresh Token
2. **Protected Routes**: Client includes JWT in `Authorization: Bearer <token>` header
3. **Token Expiration**: When JWT expires, client uses refresh token to get new JWT
4. **Logout**: Server invalidates token and refresh token

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Student** | Register for events/workshops, vote on polls, book facilities |
| **Staff** | All student permissions + create events |
| **Professor** | Create/manage workshops, view participant attendance |
| **Vendor** | Manage vendor profile, upload documents, view loyalty program |
| **Events Office** | Create/manage all events, verify documents, create polls |
| **Admin** | Full system access, manage users, view analytics |

### Middleware

- **protect.js** - Verifies JWT and extracts user info
- **requireRole.js** - Checks if user has required role
- **requireEventsOffice.js** - Events Office specific checks

---

## 🎨 Design System

### Using the Design System

Import tokens in your components:

```javascript
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOformStyles,
  EOcardStyles,
  EOalertStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
  getCitronGlowEffect,
  getTyrianGlowEffect,
} from '../styles/EOdesignSystem';
```

### Example Usage

```javascript
// Button with primary style
<button style={EObuttonStyles.primary}>
  Click Me
</button>

// Card with shadow and border
<div style={{
  ...EOcardStyles.base,
  padding: '2rem',
  borderRadius: EOradius.lg,
  boxShadow: EOshadows.lg,
}}>
  Content
</div>

// Alert with success styling
<div style={EOalertStyles.success}>
  Operation completed successfully!
</div>
```

---

## 📖 Development Guidelines

### Code Style

- Use **ES6+** syntax (arrow functions, destructuring, async/await)
- Follow **RESTful** API design principles
- Use **camelCase** for variables and functions
- Use **PascalCase** for components and classes
- Add **JSDoc comments** for functions
- Keep files under **300 lines** when possible

### Naming Conventions

```javascript
// Variables and functions
const userName = "John";
const calculateTotal = () => {};

// Components
const UserProfile = () => {};

// Constants
const MAX_FILE_SIZE = 5242880;

// Database fields
const firstName = ""; // in schemas
```

### Folder Organization

```
components/
  ├── events-office/           # EO-specific components
  ├── common/                  # Reusable components
  └── [feature]/               # Feature-specific components

pages/
  ├── [role]/                  # Role-specific pages
  └── [feature].jsx

services/
  └── api.js                   # API client

stores/
  └── [feature].js             # Zustand stores
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit with clear messages: `git commit -m "Add feature X"`
3. Push to remote: `git push origin feature/feature-name`
4. Create Pull Request with description

---

## 🧪 Testing

### Backend Testing

Use Postman or curl to test API endpoints:

```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Test with authentication
curl -H "Authorization: Bearer <token>" \
     -H "x-role: student" \
     http://localhost:5001/api/events
```

For comprehensive testing guide, see [POSTMAN_TESTING_GUIDE.md](backend/POSTMAN_TESTING_GUIDE.md)

### Frontend Testing

```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Event creation and registration
- [ ] Workshop participant tracking
- [ ] Poll voting functionality
- [ ] Document upload and verification
- [ ] Gym session booking and cancellation
- [ ] Vendor dashboard operations
- [ ] Payment processing (Stripe)
- [ ] Email notifications
- [ ] Responsive design on mobile/tablet/desktop

---

## 🚀 Deployment

### Deploying to Production

#### Backend Deployment (Heroku Example)

```bash
# Install Heroku CLI
heroku login

# Create Heroku app
heroku create brains704-backend

# Set environment variables
heroku config:set JWT_SECRET=<your_secret> \
                   MONGODB_URI=<your_mongodb_uri> \
                   STRIPE_SECRET_KEY=<your_key>

# Deploy
git push heroku main
```

#### Frontend Deployment (Vercel Example)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

#### Self-Hosted Deployment

1. Provision a server (AWS EC2, DigitalOcean, etc.)
2. Install Node.js and MongoDB
3. Clone repository and install dependencies
4. Configure environment variables
5. Set up reverse proxy (Nginx)
6. Enable HTTPS with Let's Encrypt
7. Set up PM2 for process management

```bash
# Using PM2
npm install -g pm2
pm2 start backend/src/server.js --name "brains704-api"
pm2 save
pm2 startup
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: MongoDB Connection Error
```
Error: Failed to connect to MongoDB
```
**Solution:**
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify network connectivity to MongoDB Atlas (if using cloud)
- Check firewall rules

#### Issue: JWT Token Invalid
```
Error: Invalid token
```
**Solution:**
- Ensure `JWT_SECRET` is set correctly
- Check token hasn't expired
- Verify token format in Authorization header
- Clear browser localStorage and re-login

#### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Check `CORS_ORIGIN` matches frontend URL in `.env`
- Verify backend includes CORS headers
- Restart backend server after changing `.env`

#### Issue: File Upload Fails
```
Error: Multer configuration error
```
**Solution:**
- Create upload directories: `mkdir -p uploads/{documents,vendor-documents}`
- Check file permissions: `chmod -R 755 uploads`
- Verify `MAX_FILE_SIZE` in `.env`
- Check file type is allowed

#### Issue: Email Not Sending
```
Error: SendGrid authentication failed
```
**Solution:**
- Verify `SENDGRID_API_KEY` is correct
- Check email service configuration
- Review SendGrid dashboard for issues
- Test with development email first

### Debug Mode

Enable detailed logging:

```javascript
// Backend
process.env.DEBUG = 'brains704:*';

// Frontend
localStorage.setItem('debug', 'brains704:*');
```

---

## 📝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Code Review Requirements
- Code follows style guidelines
- Tests are passing
- No console errors or warnings
- Documentation is updated
- Commit messages are clear

---

## 👥 Team

**Project**: Brains704 - University Campus Management System
**Course**: CSEN 704 - Project
**University**: Habiba German University in Cairo (GUC)
**Semester**: 7th - 2024/2025

### Contributors
- Development Team: Brains704
- Supervision: Course Instructors

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 📞 Support & Documentation

### Documentation Files
- [SETUP_CHECKLIST.md](backend/SETUP_CHECKLIST.md) - Initial setup guide
- [API_TESTING_GUIDE.md](backend/API_TESTING_GUIDE.md) - API reference
- [POSTMAN_TESTING_GUIDE.md](backend/POSTMAN_TESTING_GUIDE.md) - Postman collection
- [EVENTS_OFFICE_QUICK_START.md](frontend/src/EVENTS_OFFICE_QUICK_START.md) - EO features guide
- [DESIGN_DOCUMENTATION.md](frontend/src/DESIGN_DOCUMENTATION.md) - Design system

### Useful Resources
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JWT Guide](https://jwt.io/introduction)
- [Stripe Documentation](https://stripe.com/docs)

### Getting Help
1. Check the troubleshooting section above
2. Review relevant documentation files
3. Check GitHub Issues for similar problems
4. Contact the development team

---

## ✅ Project Checklist

- ✅ Multi-role user authentication and authorization
- ✅ Event and workshop management system
- ✅ Real-time capacity tracking
- ✅ Polling and voting system
- ✅ Vendor management with document verification
- ✅ Facility booking (Gym, Courts, Bazaar)
- ✅ Payment processing with Stripe
- ✅ Email notification system with QR codes
- ✅ Document management and storage
- ✅ Responsive design with modern UI
- ✅ Comprehensive API with role-based access
- ✅ Production-ready deployment guide

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Total Models** | 19 |
| **API Endpoints** | 30+ |
| **Frontend Components** | 50+ |
| **Lines of Backend Code** | ~5000+ |
| **Lines of Frontend Code** | ~8000+ |
| **Database Collections** | 15 |
| **User Roles** | 6 |
| **Features Implemented** | 25+ |

---

## 🎉 Quick Start Summary

```bash
# 1. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Set up environment
# Create .env files in backend/ and frontend/

# 3. Start MongoDB
mongod

# 4. Run backend (Terminal 1)
cd backend && npm run dev

# 5. Run frontend (Terminal 2)
cd frontend && npm start

# 6. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5001/api
```

---

**Happy coding! 🚀**

For questions or support, refer to the documentation files or contact the development team.
