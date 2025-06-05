const Order = require("../models/orderModel");

const createOrder = async (req, res) => {
  try {
    const { items, address, totalAmount } = req.body;
    const userId = req.user.id; // Get user ID from auth middleware

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    // Validate address fields
    if (
      !address ||
      !address.streetAddress ||
      !address.city ||
      !address.state ||
      !address.postalCode ||
      !address.country
    ) {
      return res
        .status(400)
        .json({ error: "Complete delivery address is required" });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.book || !item.quantity || !item.price) {
        return res.status(400).json({ error: "Invalid item data" });
      }
    }

    const order = new Order({
      user: userId,
      items: items.map((item) => ({
        book: item.book,
        quantity: item.quantity,
        price: item.price,
      })),
      address,
      totalAmount,
      status: "pending",
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id; // This comes from the auth middleware
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("items.book", "title image price");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createOrder, getOrders, getUserOrders };
