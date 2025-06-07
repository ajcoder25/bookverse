import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';

const Wishlist = ({ onAddToCart, onRemoveFromWishlist }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlistItems(JSON.parse(savedWishlist));
    }
  }, []);

  useEffect(() => {
    // Save wishlist to localStorage whenever it changes
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const handleAddToCart = (item) => {
    onAddToCart({
      ...item,
      quantity: 1
    });
    setNotification({
      type: 'success',
      message: 'Added to cart successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveFromWishlist = (itemId) => {
    onRemoveFromWishlist(itemId);
    setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
    setNotification({
      type: 'success',
      message: 'Removed from wishlist!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h2>
          <p className="text-gray-600 mb-6">Start adding books you love to your wishlist!</p>
          <Link
            to="/explore"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Explore Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <h2 className="text-3xl font-bold mb-8">My Wishlist</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <BackgroundGradient key={item.id} className="bg-white rounded-xl p-6">
            <div className="flex flex-col h-full">
              <Link to={`/product/${item.id}`} className="group">
                <div className="relative aspect-[3/4] mb-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x400.png?text=No+Cover';
                    }}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
              </Link>
              <p className="text-gray-600 mb-2">by {item.author}</p>
              <p className="text-lg font-bold mb-4">₹{item.price}</p>
              
              <div className="mt-auto space-y-3">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  className="w-full border-2 border-black text-black py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Remove from Wishlist
                </button>
              </div>
            </div>
          </BackgroundGradient>
        ))}
      </div>
    </div>
  );
};

export default Wishlist; 