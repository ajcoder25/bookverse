import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import BookCard from './BookCard';

const Wishlist = ({ onRemoveFromWishlist, wishlist = [] }) => {
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState(wishlist);
  const [notification, setNotification] = useState(null);

  // Keep local state in sync with prop
  useEffect(() => {
    setWishlistItems(wishlist);
  }, [wishlist]);

  const handleAddToCart = async (item) => {
  const result = await addToCart({
    ...item,
    quantity: 1
  });
  if (result && result.success) {
    setNotification({
      type: 'success',
      message: 'Added to cart successfully!'
    });
  } else {
    setNotification({
      type: 'error',
      message: 'Failed to add to cart!'
    });
  }
  setTimeout(() => setNotification(null), 3000);
};

  const handleRemoveFromWishlist = (itemId) => {
    // Defensive: normalize and compare all possible ID fields
    const normalizeId = (id) => (id ? id.toString() : '');
    const isMatch = (item, id) => {
      // Check direct fields and nested book fields
      return (
        normalizeId(item.id) === normalizeId(id) ||
        normalizeId(item._id) === normalizeId(id) ||
        normalizeId(item.bookId) === normalizeId(id) ||
        (item.book && (
          normalizeId(item.book) === normalizeId(id) ||
          normalizeId(item.book.id) === normalizeId(id) ||
          normalizeId(item.book._id) === normalizeId(id) ||
          normalizeId(item.book.bookId) === normalizeId(id)
        ))
      );
    };
    onRemoveFromWishlist(itemId);
    setWishlistItems(wishlistItems.filter(item => !isMatch(item, itemId)));
    setNotification({
      type: 'success',
      message: 'Removed from wishlist!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync local state with global prop after removal
  useEffect(() => {
    setWishlistItems(wishlist);
  }, [wishlist]);


  if (wishlistItems.length === 0) {
    return (
      <div className="relative min-h-screen bg-gray-50 py-8 px-2 sm:px-4 md:px-8 flex flex-col items-center justify-center w-full">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <svg width="80" height="80" fill="none" viewBox="0 0 24 24" className="mb-6 text-gray-400"><path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
          <h3 className="text-2xl font-semibold mb-2 text-gray-700">Your Wishlist is Empty</h3>
          <p className="text-gray-500 mb-6">Start adding books you love to your wishlist!</p>
          <Link
            to="/explore"
            className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform font-semibold text-lg"
          >
            Explore Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-100/70 via-purple-100/60 to-pink-100/70 py-12 px-2 md:px-8">
      {/* Floating header */}
      <div className="sticky top-0 z-20 mb-8 flex items-center justify-between backdrop-blur-md bg-white/40 rounded-2xl shadow-lg px-6 py-4 border border-white/30">
        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">My Wishlist</h2>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-2 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-transform font-semibold text-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Explore More
        </Link>
      </div>

      {notification && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl text-lg font-medium transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-200/90 text-green-800' : 'bg-red-200/90 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto">
        {wishlistItems.map((item) => (
  <div key={item.id} className="flex flex-col h-full w-full max-w-xs mx-auto">
    <BookCard
      book={item}
      onAddToCart={handleAddToCart}
      onAddToWishlist={onRemoveFromWishlist}
      wishlist={wishlistItems}
    />
    <button
      onClick={() => handleRemoveFromWishlist(item.id)}
      className="mt-2 flex items-center justify-center gap-2 border border-indigo-400 text-indigo-700 bg-white py-2 rounded-lg shadow hover:bg-indigo-50 transition-colors font-semibold text-sm w-full"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      Remove
    </button>
  </div>
))}
      </div>
    </div>
  );
};

export default Wishlist;