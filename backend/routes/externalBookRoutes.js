const express = require("express");
const { fetchGoogleBooks } = require("../controllers/externalBookController");
const router = express.Router();

router.get("/google", fetchGoogleBooks);

module.exports = router;
