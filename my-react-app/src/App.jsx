import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './components/Header.jsx'
import BookHero from './components/BookHero.jsx'
import Cart from './components/Cart.jsx'

function App() {
  const [searchResults, setSearchResults] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('bookCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        updateCartCount(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('bookCart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const updateCartCount = (items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
  };

  const addToCart = (book) => {
    setCartItems(prevItems => {
      // Check if the book is already in the cart
      const existingItemIndex = prevItems.findIndex(item => item.id === book.id);
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // If the book is already in the cart, increase its quantity
        updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
      } else {
        // If the book is not in the cart, add it with quantity 1
        updatedItems = [...prevItems, { ...book, quantity: 1 }];
      }
      
      updateCartCount(updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = (bookId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== bookId);
      updateCartCount(updatedItems);
      return updatedItems;
    });
  };

  return (
    <Router>
      <Header cartCount={cartCount} onSearchResults={setSearchResults} />
      <main className="min-h-screen bg-gray-50 pt-24">
        <Routes>
          <Route path="/" element={
            <BookHero 
              searchResults={searchResults} 
              onSearchResults={setSearchResults}
              onAddToCart={addToCart}
            />
          } />
          <Route path="/cart" element={
            <Cart 
              cartItems={cartItems} 
              removeFromCart={removeFromCart} 
            />
          } />
        </Routes>
      </main>
    </Router>
  )
}

export default App
