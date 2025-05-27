const express = require("express");
const router = express.Router();

// Example placeholder route for users
router.get("/", (req, res) => {
  res.json({ message: "User route is working!" });
});

module.exports = router;