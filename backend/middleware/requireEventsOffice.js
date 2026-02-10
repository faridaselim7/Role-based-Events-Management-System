// backend/middleware/requireEventsOffice.js
// ESM-compatible middleware that authorizes Events Office or Admin.
// It checks (in order): req.user.role (from your auth middleware), req.user.roles (array),
// then falls back to the `x-role` header for manual testing via Postman.

function normalizeRoles(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(r => String(r).toLowerCase().trim()).filter(Boolean);
  return String(input)
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export default function requireEventsOffice(req, res, next) {
  // Prefer roles coming from your auth layer (e.g., JWT)
  const fromUser =
    normalizeRoles(req.user?.roles) // array form
      .concat(normalizeRoles(req.user?.role)); // single string form

  // Fallback for manual testing in Postman: x-role: events_office or admin
  const fromHeader = normalizeRoles(req.get('x-role'));

  const roles = [...new Set([...fromUser, ...fromHeader])];

  const allowed = roles.includes('events_office') || roles.includes('admin');
  if (!allowed) {
    return res.status(403).json({ message: 'Events Office or Admin only' });
  }
  next();
}
