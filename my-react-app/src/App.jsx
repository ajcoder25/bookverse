import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import BookHero from './components/BookHero.jsx'
import Cart from './components/Cart.jsx'
import ExploreBooks from './components/ExploreBooks.jsx'
import AddressManagement from './components/AddressManagement.jsx'
import Auth from './components/Auth.jsx'
import UserProfile from './components/UserProfile.jsx'
import { cartService } from './services/cartService'
import bookService from './services/bookService'
import Navbar from './components/Navbar'
import Home from './components/Home'
import ProductList from './components/ProductList'
import ProductDetails from './components/ProductDetails'
import Wishlist from './components/Wishlist'
import Footer from './components/Footer'
import Checkout from './components/Checkout'
import CheckoutSuccess from './components/CheckoutSuccess'
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/auth" />;
  }
  return children;
};

import toast from 'react-hot-toast';

function App() {
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [notification, setNotification] = useState(null);
  const [featuredBooks, setFeaturedBooks] = useState([]);

  // Add to Wishlist handler
  // Optimized: update React state first for instant UI feedback, then localStorage
  const handleAddToWishlist = (book, action) => {
    try {
      let wishlistArr = [...wishlist]; // use current React state for instant update
      const normalizeId = (id) => (id ? id.toString() : '');
      // Robustly match any possible ID field
      const getBookId = (obj) => normalizeId(obj.id || obj._id || obj.bookId || (obj.book && (obj.book.id || obj.book._id || obj.book.bookId || obj.book)));
      const isMatch = (a, b) => getBookId(a) === getBookId(b);
      const exists = wishlistArr.find((b2) => isMatch(b2, book));
      if (action === 'remove' && exists) {
        const updated = wishlistArr.filter((b2) => !isMatch(b2, book));
        setWishlist(updated); // update UI immediately
        localStorage.setItem('wishlist', JSON.stringify(updated));
        toast('Removed from wishlist', { icon: '💔', position: 'top-center' });
      } else if ((action === 'add' || !action) && !exists) {
        const updated = [...wishlistArr, book];
        setWishlist(updated);
        localStorage.setItem('wishlist', JSON.stringify(updated));
        toast('💖 Added to wishlist', { icon: '💖', position: 'top-center' });
      }
    } catch (err) {
      toast.error('Failed to update wishlist.');
    }
  };

  // Load featured books
  useEffect(() => {
    const loadFeaturedBooks = async () => {
      try {
        const response = await bookService.getFeaturedBooks();
        if (response.books) {
          setFeaturedBooks(response.books);
        }
      } catch (error) {
        console.error('Error loading featured books:', error);
      }
    };
    loadFeaturedBooks();
  }, []);

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Toaster position="bottom-center" />
          <Navbar wishlistItemCount={wishlist.length} />
          <div className="pb-32">
            <Routes>
              <Route path="/" element={
                <Home 
                  onAddToWishlist={handleAddToWishlist} 
                  wishlist={wishlist} 
                />} 
              />
              <Route path="/explore" element={
                <ExploreBooks 
                  onAddToWishlist={handleAddToWishlist} 
                  wishlist={wishlist} 
                />} 
              />
              <Route path="/products" element={
                <ProductList 
                  onAddToWishlist={handleAddToWishlist} 
                  wishlist={wishlist}
                />} 
              />
              <Route path="/product/:id" element={
                <ProductDetails 
                  onAddToWishlist={handleAddToWishlist} 
                  wishlist={wishlist}
                />} 
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist 
                      wishlist={wishlist}
                      onRemoveFromWishlist={(id) => {
                        // Remove by id and update App state
                        let wishlistArr = (JSON.parse(localStorage.getItem('wishlist')) || []).filter(
                          (b) => b.id !== id && b._id !== id
                        );
                        localStorage.setItem('wishlist', JSON.stringify(wishlistArr));
                        setWishlist(wishlistArr);
                      }}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route path="/checkout-success" element={<CheckoutSuccess />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/address"
                element={
                  <ProtectedRoute>
                    <AddressManagement />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
