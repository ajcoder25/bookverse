const mongoose = require('mongoose');
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
        image,
        isGoogleBook: !mongoose.Types.ObjectId.isValid(bookId) // Set to true if not a valid ObjectId
      }]
    });
  } else {
    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
      item.book.toString() === bookId.toString()
    );

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
        image,
        isGoogleBook: !mongoose.Types.ObjectId.isValid(bookId) // Set to true if not a valid ObjectId
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
  if (!bookId) {
    res.status(400);
    throw new Error("Book ID is required");
  }

  console.log('Removing item with ID:', bookId, 'for user:', req.user._id);
  
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find the cart with a write lock to prevent race conditions
    const cart = await Cart.findOne({ user: req.user._id })
      .session(session);
    
    if (!cart) {
      throw new Error("Cart not found");
    }

    console.log('Cart items before removal:', cart.items.length);
    console.log('Looking for bookId:', bookId);
    
    // Create a new array without the item to remove
    const updatedItems = [];
    let itemFound = false;
    
    for (const item of cart.items) {
      const itemBookId = item.book && item.book.toString ? item.book.toString() : item.book;
      console.log('Checking item:', {
        itemBookId,
        bookId,
        type: typeof itemBookId,
        match: itemBookId === bookId
      });
      
      if (itemBookId === bookId) {
        itemFound = true;
        continue; // Skip adding this item to the updated array
      }
      updatedItems.push(item);
    }
    
    // If no items were removed, the item wasn't in the cart
    if (!itemFound) {
      console.log('Item not found in cart. Current items:', cart.items);
      throw new Error("Item not found in cart");
    }
    
    // Update the cart with the new items array
    const updatedCart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: updatedItems } },
      { new: true, session }
    );
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log('Successfully removed item from cart');
    res.json(updatedCart);
    
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error removing item from cart:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to remove item from cart'
    });
  }
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

  const cartItem = cart.items.find(item => item.book.toString() === bookId.toString());

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