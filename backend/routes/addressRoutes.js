const express = require("express");
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");
const router = express.Router();

// Routes for address management
router.get("/", getAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

module.exports = router;
