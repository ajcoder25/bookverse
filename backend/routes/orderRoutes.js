const express = require("express");
const {
  createOrder,
  getOrders,
  getUserOrders,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, getOrders);
router.get("/my-orders", protect, getUserOrders);

module.exports = router;
