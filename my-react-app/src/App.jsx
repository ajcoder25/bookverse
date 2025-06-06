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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/auth" />;
  }
  return children;
};

function App() {
  const [searchResults, setSearchResults] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [notification, setNotification] = useState(null);
  const [featuredBooks, setFeaturedBooks] = useState([]);

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
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<ExploreBooks />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetails />} />
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
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
