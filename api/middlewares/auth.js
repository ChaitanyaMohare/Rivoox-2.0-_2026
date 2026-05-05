import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log('[auth] Authorization header:', authHeader ? 'present' : 'missing');

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('[auth] No valid Bearer token');
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[auth] Token decoded successfully, user:', decoded);
    req.user = decoded; // attach user id, role
    next();
  } catch (err) {
    console.log('[auth] Token verification failed:', err.message);
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};


export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    next();
  };
};