module.exports = (req, res, next) => {
  // verifyJWT already ran, so req.user is populated
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: "Access Denied: Admins only" });
  }
};