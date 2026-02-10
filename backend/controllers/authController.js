// import { User } from "../models/User.js";
// import { Admin } from "../models/adminModel.js"; // ensure adminModel exports { Admin }
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import Joi from "joi";

// import crypto from "crypto";
// import sgMail from "@sendgrid/mail";


// if (process.env.SENDGRID_API_KEY) {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }


// /* =============================
//    🟩 SIGNUP
// ============================= */

// export const signup = async (req, res) => {
//   try {
//     const {
//       email,
//       password,
//       firstName,
//       lastName,
//       studentOrStaffId,
//       companyName,
//       role,
//     } = req.body;

//     // 1️⃣ Check if email already exists in User collection
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // 2️⃣ Vendor signup → store in Users collection with role "Vendor"
//     if (role === "Vendor") {
//       if (!companyName) {
//         return res
//           .status(400)
//           .json({ message: "Company name is required for vendors" });
//       }

//       const newVendor = new User({
//         email,
//         password,
//         companyName,
//         role: "Vendor", // ✅ Vendor role
//         // (optional) you can explicitly set:
//         // isVerified: true,
//         // status: "Active",
//       });

//       await newVendor.save();
//       return res
//         .status(201)
//         .json({ message: "Vendor signup successful. You can now log in." });
//     }

//     // 3️⃣ Students / Staff / TAs / Professors → store in users collection
//     // Force unknown role at signup if not Student
//     const assignedRole = role === "Student" ? "Student" : "Unknown";

//     const newUser = new User({
//       email,
//       password,
//       firstName,
//       lastName,
//       studentOrStaffId,
//       companyName,
//       role: assignedRole,
//       // ✅ always unverified at signup
//       isVerified: false,
//       status: "Pending",
//     });

//     // ✅ If Student → generate verification token + send email
//     if (assignedRole === "Student") {
//       const token = crypto.randomBytes(32).toString("hex");
//       newUser.verificationToken = token;
//       newUser.verificationTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

//       const backendBase =
//         process.env.BACKEND_URL ||
//         `http://localhost:${process.env.PORT || 5001}`;
//       

//       try {
//         if (process.env.SENDGRID_API_KEY && process.env.OUTLOOK_USER) {
//           const displayName =
//             [firstName, lastName].filter(Boolean).join(" ").trim() || email;

//           await sgMail.send({
//             to: email,
//             from: process.env.OUTLOOK_USER,
//             subject: "Verify your account",
//             html: `
//               <p>Hello ${displayName},</p>
//               <p>Welcome to GUC Event Management 🎉</p>
//               <p>Please verify your account by clicking the link below:</p>
//               <p><a href="${verifyLink}">Verify my account</a></p>
//               <p>This link will redirect you to the login page and expires in 1 hour.</p>
//             `,
//           });
//         } else {
//           console.warn(
//             "Skipping verification email: missing SENDGRID_API_KEY or OUTLOOK_USER"
//           );
//         }
//       } catch (e) {
//         console.error("Error sending verification email:", e);
//       }
//     }

//     // ✅ Save user after potential token setup
//     await newUser.save();

//     return res.status(201).json({
//       message:
//         assignedRole === "Student"
//           ? "Signup successful. Please check your email to verify your account."
//           : "Signup successful. You can now log in.",
//     });
//   } catch (error) {
//     console.error("Signup error:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };


// export async function login(req, res, next) {
//   try {
//     const { email, password } = req.body || {};
//     if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

//     const emailNorm = normalizeEmail(email);

//     // User lookup (ensure password selected if schema hides it)
//     let principal = await User.findOne({ email: emailNorm })
//       .select("+password +status +role +firstName +lastName +email +isVerified")
//       .lean();
//     let principalType = principal ? "user" : null;

//     let valid = principal ? await comparePw(password, principal.password) : false;

//     // Admin / Events Office fallback if user missing or invalid password
//     if (!valid) {
//       const emailCI = new RegExp(`^${emailNorm}$`, "i");
//       const adminDoc = await Admin.findOne({ email: emailCI })
//         .select("+password +status +role +firstName +lastName +email")
//         .lean();

//       if (adminDoc) {
//         const adminValid = await comparePw(password, adminDoc.password);
//         if (adminValid) {
//           principal = adminDoc;
//           principalType = "admin";
//           valid = true;
//         }
//       }
//     }

//     if (!valid || !principal) return res.status(401).json({ message: "Invalid email or password" });

//     const statusStr = String(principal.status || "").trim().toLowerCase();
//     if (["blocked", "suspended", "inactive"].includes(statusStr))
//       return res.status(403).json({ message: "Your account is blocked. Please contact support." });

//     // GUC email rule only for academic roles
//     const academicRoles = ["Student", "Staff", "TA", "Professor"];
   
//     if (academicRoles.includes(principal.role) && !principal.isVerified) {
//       return res.status(403).json({
//         message:
//           "Your account is not yet verified. Please check your email for the verification link.",
//       });
//     }



//     if (academicRoles.includes(principal.role) &&
//         !emailNorm.endsWith("guc.edu.eg") &&
//         !emailNorm.endsWith("student.guc.edu.eg")) {
//       return res.status(403).json({ message: "You must use your GUC email to log in" });
//     }

//     // Normalize role for token
//     const rawRole = String(principal.role || "").trim().toLowerCase().replace(/\s+/g, "_");
//     const normRole = rawRole === "event_office" ? "events_office" : rawRole;

//     const token = jwt.sign({ id: principal._id, role: normRole }, process.env.JWT_SECRET, { expiresIn: "1d" });

//     return res.json({
//       message: "Login successful",
//       token,
//       user: {
//         id: principal._id,
//         email: principal.email,
//         role: normRole,
//         firstName: principal.firstName,
//         lastName: principal.lastName,
//         status: principal.status || "Active",
//         type: principalType
//       }
//     });
//   } catch (err) {
//     console.error("LOGIN error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

import jwt from "jsonwebtoken";

import bcrypt from "bcryptjs";

import crypto from "crypto";

import Joi from "joi";

import sgMail from "@sendgrid/mail";

import { User } from "../models/User.js";

import { Admin } from "../models/adminModel.js";



if (process.env.SENDGRID_API_KEY) {

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

}



/* =============================

   HELPER FUNCTIONS

============================= */



// Normalize email to lowercase

function normalizeEmail(email) {

  if (!email) return "";

  return String(email).trim().toLowerCase();

}



// Compare password (handles both hashed and plain text)

async function comparePw(plainPassword, storedPassword) {

  try {

    if (!plainPassword || !storedPassword) return false;

    

    // Check if password is hashed (bcrypt format)

    if (/^\$2[aby]\$/.test(storedPassword)) {

      return await bcrypt.compare(plainPassword, storedPassword);

    }

    

    // Plain text comparison (legacy support)

    return plainPassword === storedPassword;

  } catch (error) {

    console.error("Error comparing passwords:", error);

    return false;

  }

}



// Sign JWT token

function signToken(userId, role) {

  if (!process.env.JWT_SECRET) {

    throw new Error("JWT_SECRET is not defined in environment variables");

  }

  

  return jwt.sign(

    { id: userId, role: role },

    process.env.JWT_SECRET,

    { expiresIn: "1d" }

  );

}



// Escape regex special characters

function escapeRegex(s) {

  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

}



/* =============================

   🟩 SIGNUP

============================= */



export const signup = async (req, res) => {

  try {

    const {

      email,

      password,

      firstName,

      lastName,

      studentOrStaffId,

      companyName,

      role,

    } = req.body;



    // Validate required fields

    if (!email || !password) {

      return res.status(400).json({ message: "Email and password are required" });

    }



    const emailNorm = normalizeEmail(email);



    // Check if email already exists

    const existingUser = await User.findOne({ email: emailNorm });

    if (existingUser) {

      return res.status(400).json({ message: "User already exists" });

    }



    // Vendor signup

    if (role === "Vendor") {

      if (!companyName) {

        return res

          .status(400)

          .json({ message: "Company name is required for vendors" });

      }



      const newVendor = new User({

        email: emailNorm,

        password,

        companyName,

        role: "Vendor",

        isVerified: true,

        status: "Active",

      });



      await newVendor.save();

      return res

        .status(201)

        .json({ message: "Vendor signup successful. You can now log in." });

    }

// Students / Staff / TAs / Professors

// Normalize role coming from frontend (handles "student" / "Student" / " STUDENT ")
// Normalize role from frontend
const roleRaw = (role || "").toString().trim().toLowerCase();

// Determine assigned role
let assignedRole = "Unknown"; // default for all non-students

if (roleRaw === "student") {
  assignedRole = "Student";
}

// 🚫 Do NOT auto-verify students – they must click the email link
const newUser = new User({
  email: emailNorm,
  password,
  firstName,
  lastName,
  studentOrStaffId,
  companyName,
  role: assignedRole,
  isVerified: false,     // always false at signup
  status: "Pending",     // until verification / admin approval
});




    // If Student → generate verification token + send email

    if (assignedRole === "Student") {

      const token = crypto.randomBytes(32).toString("hex");

      newUser.verificationToken = token;

      newUser.verificationTokenExpires = Date.now() + 60 * 60 * 1000;



      const backendBase =

        process.env.BACKEND_URL ||

        `http://localhost:${process.env.PORT || 5001}`;

      const verifyLink = `${backendBase}/api/auth/verify/${token}?redirect=1`;




      try {

        if (process.env.SENDGRID_API_KEY && process.env.OUTLOOK_USER) {

          const displayName =

            [firstName, lastName].filter(Boolean).join(" ").trim() || email;



          await sgMail.send({

            to: email,

            from: process.env.OUTLOOK_USER,

            subject: "Verify your account",

            html: `

              <p>Hello ${displayName},</p>

              <p>Welcome to GUC Event Management 🎉</p>

              <p>Please verify your account by clicking the link below:</p>

              <p><a href="${verifyLink}">Verify my account</a></p>

              <p>This link will redirect you to the login page and expires in 1 hour.</p>

            `,

          });

        }

      } catch (e) {

        console.error("Error sending verification email:", e);

      }

    }



    await newUser.save();



    return res.status(201).json({

      message:

        assignedRole === "Student"

          ? "Signup successful. Please check your email to verify your account."

          : "Signup successful. Your account is pending admin approval.",

    });

  } catch (error) {

    console.error("Signup error:", error);

    return res.status(500).json({ 

      message: "An error occurred during signup. Please try again.",

      error: process.env.NODE_ENV === "development" ? error.message : undefined

    });

  }

};



/* =============================

   🟦 LOGIN

============================= */



const loginSchema = Joi.object({

  email: Joi.string().email().required(),

  password: Joi.string().required(),

});



export async function login(req, res) {

  try {

    // Check JWT_SECRET first

    if (!process.env.JWT_SECRET) {

      console.error("CRITICAL: JWT_SECRET is not defined!");

      return res.status(500).json({ 

        message: "Server configuration error. Please contact administrator." 

      });

    }



    // Validate input

    const { value, error } = loginSchema.validate(req.body);

    if (error) {

      return res.status(400).json({ message: error.details[0].message });

    }



    const { email, password } = value;

    

    if (!email || !password) {

      return res.status(400).json({ message: "Email and password are required" });

    }



    const emailNorm = normalizeEmail(email);



    let principal = null;

    let principalType = null;



    // 1) Try Users collection first

    try {

      const user = await User.findOne({ email: emailNorm })

        .select("+password +status +role +firstName +lastName +email +isVerified +companyName +studentOrStaffId")

        .lean();



      if (user && user.password) {

        const validPassword = await comparePw(password, user.password);

        

        if (validPassword) {

          principal = user;

          principalType = "user";

        }

      }

    } catch (userError) {

      console.error("Error querying User collection:", userError);

      // Continue to admin check

    }



    // 2) If not found in Users, try Admin collection

    if (!principal) {

      try {

        const emailRegex = new RegExp(`^${escapeRegex(emailNorm)}$`, "i");

        const admin = await Admin.findOne({ email: emailRegex })

          .select("+password +status +role +firstName +lastName +email")

          .lean();



        if (admin && admin.password) {

          const validPassword = await comparePw(password, admin.password);

          

          if (validPassword) {

            principal = admin;

            principalType = "admin";

          }

        }

      } catch (adminError) {

        console.error("Error querying Admin collection:", adminError);

      }

    }



    // 3) Invalid credentials

    if (!principal) {

      return res.status(401).json({ message: "Invalid email or password" });

    }



    // 4) Check account status

    const statusStr = String(principal.status || "active").trim().toLowerCase();

    if (["blocked", "suspended", "inactive"].includes(statusStr)) {

      return res.status(403).json({

        message: "Your account is blocked. Please contact support.",

      });

    }



    // 5) Block users with "Unknown" role

    if (principal.role === "Unknown") {

      return res.status(403).json({

        message: "Your account is pending admin approval. Please wait for confirmation.",

      });

    }



    // 6) GUC email verification check

    const academicRoles = ["Student", "Staff", "TA", "Professor"];

    if (academicRoles.includes(principal.role) && !principal.isVerified) {

      return res.status(403).json({

        message: "Your account is not yet verified. Please check your email for the verification link.",

      });

    }



    // 7) GUC email domain rule

    const hasGUCEmail = 

      emailNorm.endsWith("@guc.edu.eg") || 

      emailNorm.endsWith("@student.guc.edu.eg");

    

    if (academicRoles.includes(principal.role) && !hasGUCEmail) {

      return res.status(403).json({

        message: "You must use your GUC email to log in",

      });

    }



    // 8) Normalize role for token

    let roleForToken = String(principal.role || "")

      .trim()

      .toLowerCase()

      .replace(/\s+/g, "_");



    // Handle special cases

    if (roleForToken === "event_office" || principal.role === "EventsOffice") {

      roleForToken = "events_office";

    }



    // 9) Generate JWT token

    const token = signToken(principal._id, roleForToken);



    // 10) Return success response

    return res.json({

      message: "Login successful",

      token,

      user: {

        id: principal._id,

        email: principal.email,

        role: roleForToken,

        firstName: principal.firstName || "",

        lastName: principal.lastName || "",

        companyName: principal.companyName,

        status: principal.status || "Active",

        type: principalType,

        studentOrStaffId: principal.studentOrStaffId || null,

        wallet: principal.wallet ?? 0,

      },

    });

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    return res.status(500).json({ 

      message: "An error occurred during login. Please try again.",

      error: process.env.NODE_ENV === "development" ? err.message : undefined

    });

  }

}







/* =============================
   ✅ EMAIL VERIFICATION
============================= */

export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send("Verification token is required.");
    }

    // Find user with this token that hasn't expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    // Mark as verified
    user.isVerified = true;
    user.status = "Active";
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    // Where to send user after successful verification
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";

    // If link was sent with ?redirect=1 → redirect to login page
    if (req.query.redirect === "1") {
      return res.redirect(`${frontendBase}/login?verified=1`);
    }

    // Fallback JSON (for Postman etc.)
    return res.json({ message: "Account verified successfully." });
  } catch (error) {
    console.error("Verify account error:", error);
    return res.status(500).send("Server error during verification.");
  }
};


/* =============================

   🔒 TOKEN VERIFICATION MIDDLEWARE

============================= */




export const verifyToken = (req, res, next) => {

  try {

    // Get token from header

    const authHeader = req.headers.authorization;

    

    if (!authHeader) {

      return res.status(401).json({ message: "No token provided" });

    }



    // Check if it's a Bearer token

    const token = authHeader.startsWith("Bearer ")

      ? authHeader.substring(7)

      : authHeader;



    if (!token) {

      return res.status(401).json({ message: "No token provided" });

    }



    // Verify token

    if (!process.env.JWT_SECRET) {

      console.error("JWT_SECRET is not defined");

      return res.status(500).json({ message: "Server configuration error" });

    }



    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    

    // Attach user info to request

    req.user = {

      id: decoded.id,

      role: decoded.role,

    };



    next();

  } catch (error) {

    if (error.name === "TokenExpiredError") {

      return res.status(401).json({ message: "Token has expired. Please login again." });

    }

    

    if (error.name === "JsonWebTokenError") {

      return res.status(401).json({ message: "Invalid token. Please login again." });

    }



    console.error("Token verification error:", error);

    return res.status(401).json({ message: "Authentication failed" });

  }

};



/* =============================

   🔒 ROLE-BASED ACCESS MIDDLEWARE

============================= */



export const requireRole = (...allowedRoles) => {

  return (req, res, next) => {

    if (!req.user) {

      return res.status(401).json({ message: "Authentication required" });

    }



    const userRole = req.user.role.toLowerCase();

    const allowed = allowedRoles.map(r => r.toLowerCase());



    if (!allowed.includes(userRole)) {

      return res.status(403).json({ 

        message: "Access denied. Insufficient permissions." 

      });

    }



    next();

  };

};



/* =============================

   📋 GET CURRENT USER INFO

============================= */



export const getCurrentUser = async (req, res) => {

  try {

    if (!req.user || !req.user.id) {

      return res.status(401).json({ message: "Not authenticated" });

    }



    // Try to find user in User collection

    let user = await User.findById(req.user.id)

      .select("-password")

      .lean();



    let userType = "user";



    // If not found, try Admin collection

    if (!user) {

      user = await Admin.findById(req.user.id)

        .select("-password")

        .lean();

      userType = "admin";

    }



    if (!user) {

      return res.status(404).json({ message: "User not found" });

    }



    // Normalize role

    let roleForResponse = String(user.role || "")

      .trim()

      .toLowerCase()

      .replace(/\s+/g, "_");



    if (roleForResponse === "event_office") {

      roleForResponse = "events_office";

    }



    return res.json({

      user: {

        id: user._id,

        email: user.email,

        role: roleForResponse,

        firstName: user.firstName || "",

        lastName: user.lastName || "",

        companyName: user.companyName,

        status: user.status || "Active",

        type: userType,

        isVerified: user.isVerified,

        studentOrStaffId: user.studentOrStaffId || null,

        wallet: user.wallet || 0,  // ← Make sure this is included 
        googleCalendar: user.googleCalendar,   
      },

    });

  } catch (error) {

    console.error("Get current user error:", error);

    return res.status(500).json({ 

      message: "Error fetching user information",

      error: process.env.NODE_ENV === "development" ? error.message : undefined

    });

  }


};
// export const resetPassword = async (req, res) => {
//   try {
//     const { email, newPassword, confirmPassword } = req.body || {};

//     // Basic validation
//     if (!email || !newPassword || !confirmPassword) {
//       return res.status(400).json({ message: "Email and both password fields are required" });
//     }

//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ message: "Password must be at least 6 characters long" });
//     }

//     // Normalize email exactly like in login
//     const emailNorm = normalizeEmail(email);

//     let account = null;

//     // 1) Try Users collection (case-normalized, same as login)
//     try {
//       account = await User.findOne({ email: emailNorm });
//     } catch (userErr) {
//       console.error("Error querying User collection during resetPassword:", userErr);
//     }

//     // 2) If not found, try Admin collection (case-insensitive regex, like login)
//     if (!account) {
//       try {
//         const emailRegex = new RegExp(`^${escapeRegex(emailNorm)}$`, "i");
//         account = await Admin.findOne({ email: emailRegex });
//       } catch (adminErr) {
//         console.error("Error querying Admin collection during resetPassword:", adminErr);
//       }
//     }

//     if (!account) {
//       return res.status(404).json({ message: "Account with this email not found" });
//     }

//     // Let Mongoose pre-save hooks handle hashing; just set the new plain password
//     account.password = newPassword;
//     await account.save();
//     //reset verification mail
//     try {
//       if (process.env.SENDGRID_API_KEY && process.env.OUTLOOK_USER) {
//         const displayName =
//           [account.firstName, account.lastName].filter(Boolean).join(" ").trim() || emailNorm;

//         await sgMail.send({
//           to: emailNorm,
//           from: process.env.OUTLOOK_USER,
//           subject: "Password Reset Successful",
//           html: `
//             <p>Hello ${displayName},</p>
//             <p>Your password for GUC Event Management has been successfully reset.</p>
//             <p>If you did not make this change, please contact support immediately.</p>
//             <p>For security reasons, we recommend:</p>
//             <ul>
//               <li>Using a strong, unique password</li>
//               <li>Not sharing your password with anyone</li>
//               <li>Enabling two-factor authentication if available</li>
//             </ul>
//             <p>Thank you for using GUC Event Management.</p>
//           `,
//         });
//         console.log(`Password reset confirmation email sent to ${emailNorm}`);
//       } else {
//         console.warn(
//           "Skipping password reset email: missing SENDGRID_API_KEY or OUTLOOK_USER"
//         );
//       }
//     } catch (emailError) {
//       console.error("Error sending password reset confirmation email:", emailError);
//       // Don't fail the request if email fails
//     }

    
//     if (!process.env.JWT_SECRET) {
//       console.error("JWT_SECRET is not defined while resetting password");
//       return res.status(500).json({ message: "Server configuration error. Please contact administrator." });
//     }

//     // Create a JWT for automatic login (same payload shape as login)
//     let roleForToken = String(account.role || "user")
//       .trim()
//       .toLowerCase()
//       .replace(/\s+/g, "_");

//     if (roleForToken === "event_office" || account.role === "EventsOffice") {
//       roleForToken = "events_office";
//     }

//     const token = jwt.sign(
//       {
//         id: account._id,
//         role: roleForToken,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.status(200).json({
//       message: "Password updated successfully",
//       token,
//       user: {
//         id: account._id,
//         email: account.email,
//         role: roleForToken,
//       },
//     });
//   } catch (error) {
//     console.error("resetPassword error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// ─────────────────────────────────────
// 1. REQUEST PASSWORD RESET (send email with link)
// ─────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const emailNorm = normalizeEmail(email);

    let user = await User.findOne({ email: emailNorm });
    if (!user) {
      const emailRegex = new RegExp(`^${escapeRegex(emailNorm)}$`, "i");
      const admin = await Admin.findOne({ email: emailRegex });
      if (!admin) return res.status(404).json({ message: "No account found with this email" });
      user = admin;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    // send email (same as you already have)...

    // 👇 IMPORTANT: send token back for frontend demo link
    return res.json({
      message: "Password reset link sent to your email",
      resetToken, // <--- add this
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// 2. RESET PASSWORD FROM TOKEN
// ─────────────────────────────────────
export const resetPasswordFromToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match or are empty" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    let account = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!account) {
      account = await Admin.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
    }

    if (!account) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // ⚠️ IMPORTANT: assign PLAIN password, not pre-hashed
    account.password = password;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;

    await account.save(); // pre("save") will hash

    // (Optional) confirmation email...

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};