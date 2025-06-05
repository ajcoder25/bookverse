const Cart = require("../models/cartmodel");
const asyncHandler = require("express-async-handler");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json(cart || { items: [] });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { bookId, quantity, price, title, author, image } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{
        book: bookId,
        quantity,
        price,
        title,
        author,
        image
      }]
    });
  } else {
    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.book.toString() === bookId);

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity = quantity;
    } else {
      // Add new item if it doesn't exist
      cart.items.push({
        book: bookId,
        quantity,
        price,
        title,
        author,
        image
      });
    }
    await cart.save();
  }

  res.status(201).json(cart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:bookId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const bookId = req.params.bookId;
  
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter(item => item.book.toString() !== bookId);
  await cart.save();

  res.json(cart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:bookId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const bookId = req.params.bookId;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  const cartItem = cart.items.find(item => item.book.toString() === bookId);

  if (!cartItem) {
    res.status(404);
    throw new Error("Item not found in cart");
  }

  cartItem.quantity = quantity;
  await cart.save();

  res.json(cart);
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.json({ message: "Cart cleared" });
});

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
}; 