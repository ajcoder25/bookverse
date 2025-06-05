const express = require("express");
const { fetchGoogleBooks, fetchGoogleBookById } = require("../controllers/externalBookController");
const router = express.Router();

// Search books
router.get("/google", fetchGoogleBooks);

// Get book details by ID
router.get("/google/:id", fetchGoogleBookById);

module.exports = router;
