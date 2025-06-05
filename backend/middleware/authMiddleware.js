const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret"
      );

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      next();
      return;
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized" });
      return;
    }
  }

  res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { protect };
