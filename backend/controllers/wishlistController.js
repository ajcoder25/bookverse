const Wishlist = require("../models/wishlistModel");

const addToWishlist = async (req, res) => {
  try {
    const { user, product } = req.body;
    let wishlist = await Wishlist.findOne({ user });

    if (!wishlist) {
      wishlist = new Wishlist({ user, items: [{ product }] });
    } else {
      // Prevent duplicates
      if (!wishlist.items.some(item => item.product.toString() === product)) {
        wishlist.items.push({ product });
      }
    }
    await wishlist.save();
    res.status(201).json(wishlist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.findOne({ user: userId }).populate("items.product");
    res.json(wishlist || { items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(item => item.product.toString() !== productId);
      await wishlist.save();
      res.json(wishlist);
    } else {
      res.status(404).json({ error: "Wishlist not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist };