// // backend/middleware/requireRole.js
// export const requireRole = (allowedRoles) => {
//   return (req, res, next) => {
//     // Use req.user from JWT (set by protect middleware)
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized - no token" });
//     }
//   }
// }

// backend/middleware/requireRole.js (ESM)
export function normalizeRole(r) {
  if (!r) return "";
  
  const v = String(r).trim().toLowerCase().replace(/\s+/g, "_");

  // EventsOffice variations
  // Add this inside normalizeRole, right after toLowerCase()
if (v === "eventsoffice" || v === "events_office" || v === "eventoffice" || v === "Eventsoffice") {
  return "events_office";
}

  // Admin
  if (v === "admin") {
    return "admin";
  }

  // Professor — THIS MUST COME BEFORE final return
  if (v === "professor" || v === "prof" || v === "prof.") {
    return "professor";
  }

  // TA
  if (["teacher_assistant", "teaching_assistant", "ta"].includes(v)) {
    return "ta";
  }
  //Vendor
  if (v === "vendor" || v === "Vendor") return "vendor";

  // Default
  return v;
}



export function requireRole(...allowed) {
  const allowedSet = new Set(allowed.map(r => normalizeRole(r))); // ← keep this
  // BUT make sure you're passing lowercase in routes! OR better:
  return (req, res, next) => {
    // 1. Check for JWT user (from protect middleware)
    if (!req.user && !req.headers["x-role"]) {
      return res.status(401).json({ message: "Unauthorized - no token" });
    }

    // 2. Get role from JWT or x-role header (for Postman testing)
// NEW (CORRECT) — supports both role AND userType fields

    //const rawRole = req.user?.role || req.user?.userType || req.headers["x-role"]; changed by shahd
    
    const rawRole = req.user?.role || req.user?.userType || req.headers["x-role"];
    const role = normalizeRole(rawRole);

    // 3. Validate role
    if (!role || !allowedSet.has(role)) {
      return res.status(403).json({
        message: `Forbidden: insufficient role. Allowed: ${[...allowedSet].join(", ")}`
      });
    }

    // 4. Success
    next();
  };
}
// export function requireRole(...allowed) {
//   const allowedSet = new Set(allowed.map(normalizeRole));
//   return (req, res, next) => {
//     // Use req.user from JWT (set by protect middleware)
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized - no token" });
//     }
//     const rawRole = req.user?.role ?? req.headers["x-role"]; // header helps in Postman tests
//     const role = normalizeRole(rawRole);

//     if (!role || !allowedSet.has(role)) {
//       return res.status(403).json({ message: "Forbidden: insufficient role" });
//     }

//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         message: `Allowed roles: ${allowedRoles.join(", ")}`
//       });
//     }

//     next();
//   };
// }