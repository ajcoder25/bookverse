const express = require("express");
const { 
  fetchGoogleBooks, 
  fetchGoogleBookById,
  testApiKey 
} = require("../controllers/externalBookController");
const router = express.Router();

// Test endpoint to verify API key is loaded
router.get("/test-api-key", testApiKey);

// Search books
router.get("/google", fetchGoogleBooks);

// Get book details by ID
router.get("/google/:id", fetchGoogleBookById);

module.exports = router;
