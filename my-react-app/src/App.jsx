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
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [notification, setNotification] = useState(null);
  const [featuredBooks, setFeaturedBooks] = useState([]);

  // Add to Cart handler
  const handleAddToCart = async (book) => {
    try {
      // Add to cart in local storage (simulate API)
      await cartService.addToCart({
        ...book,
        quantity: book.quantity || 1
      });
      // Get updated cart from localStorage and update count
      const cartArr = JSON.parse(localStorage.getItem('cart')) || [];
      const totalItems = cartArr.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(totalItems);
      toast.success('Added to cart!', { position: 'top-center' });
    } catch (err) {
      toast.error('Failed to add to cart.');
    }
  };

  // Add to Wishlist handler
  const handleAddToWishlist = (book, action) => {
    try {
      let wishlistArr = JSON.parse(localStorage.getItem('wishlist')) || [];
      const exists = wishlistArr.find((b) => b.id === book.id || b._id === book._id);
      if (action === 'remove' && exists) {
        wishlistArr = wishlistArr.filter((b) => b.id !== book.id && b._id !== book._id);
        localStorage.setItem('wishlist', JSON.stringify(wishlistArr));
        setWishlist(wishlistArr);
        toast('Removed from wishlist', { icon: '💔', position: 'top-center' });
      } else if ((action === 'add' || !action) && !exists) {
        wishlistArr.push(book);
        localStorage.setItem('wishlist', JSON.stringify(wishlistArr));
        setWishlist(wishlistArr);
        toast('💖 Added to wishlist', { icon: '💖', position: 'top-center' });
      } else if (exists) {
        toast('Already in wishlist!', { icon: '❤️', position: 'top-center' });
      }
    } catch (err) {
      toast.error('Failed to update wishlist.');
    }
  };

  // Load featured books
  useEffect(() => {
    // Load cart and wishlist counts from localStorage on mount
    const cartArr = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cartArr.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
    const wishlistArr = JSON.parse(localStorage.getItem('wishlist')) || [];
    setWishlist(wishlistArr);

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
          <Navbar cartItemCount={cartCount} wishlistItemCount={wishlist.length} />
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
                    <Wishlist />
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
