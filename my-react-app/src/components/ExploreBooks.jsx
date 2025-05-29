import React, { useState, useEffect } from 'react';
import bookService from '../api/bookService';
import { BackgroundGradient } from './ui/background-gradient';

const ExploreBooks = ({ onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(true);
  
  // Define categories
  const categories = ['All', 'Fiction', 'Science', 'History', 'Biography', 'Business', 'Romance', 'Fantasy', 'Mystery'];

  // Convert USD to INR with a reasonable price range
  const getReasonablePrice = (basePrice) => {
    // Ensure basePrice is a number
    const price = Number(basePrice) || 29.99;
    
    // Generate a price between 299 and 799 for most books
    if (price < 15) {
      return 299 + (price * 10); // 299-449 range for cheaper books
    } else if (price < 30) {
      return 499 + ((price - 15) * 20); // 499-799 range for mid-range books
    } else if (price < 50) {
      return 799 + ((price - 30) * 50); // 799-1799 range for premium books
    } else {
      // Cap at 5000 for very expensive books
      return Math.min(1999 + ((price - 50) * 100), 5000);
    }
  };
  
  // Get original price (slightly higher than the sale price)
  const getOriginalPrice = (salePrice) => {
    return Math.round(salePrice * 1.25); // 25% higher than sale price
  };

  // Get random rating for books (since Google Books API doesn't always provide ratings)
  const getBookRating = (book) => {
    // Use the book's ID to generate a consistent rating
    const idSum = book.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    // Generate a rating between 1 and 5, with one decimal place
    return Math.round((idSum % 40 + 10) / 10) / 2 + 2;
  };

  // Render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a.75.75 0 01.671.415l2.834 5.878 6.342.923a.75.75 0 01.415 1.278l-4.6 4.482 1.086 6.327a.75.75 0 01-1.088.791L10 18.347l-5.66 2.98a.75.75 0 01-1.088-.79l1.086-6.328-4.6-4.482a.75.75 0 01.415-1.278l6.342-.923 2.834-5.878A.75.75 0 0110 2zm0 2.445L8.615 7.278a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L10 4.445z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return stars;
  };

  const addToCart = (book) => {
    // Calculate the reasonable price
    const price = getReasonablePrice(book.price);
    const originalPrice = getOriginalPrice(price);
    
    // Create a cart item with all necessary information
    const cartItem = {
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      price: price,
      originalPrice: originalPrice,
      image: book.image
    };
    
    // Call the parent component's onAddToCart function
    onAddToCart(cartItem);
    
    // Show notification
    setNotification({
      bookTitle: book.title,
      message: `${book.title} added to cart!`
    });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Reset all filters
  const resetFilters = () => {
    setMinPrice(0);
    setMaxPrice(5000);
    setMinRating(0);
    setActiveCategory('All');
  };

  // Apply filters and sorting
  useEffect(() => {
    if (books.length > 0) {
      let filtered = [...books];
      
      // Apply price filter
      filtered = filtered.filter(book => {
        const price = getReasonablePrice(book.price);
        return price >= minPrice && price <= maxPrice;
      });
      
      // Apply rating filter
      filtered = filtered.filter(book => {
        const rating = getBookRating(book);
        return rating >= minRating;
      });
      
      // Apply sorting
      switch(sortBy) {
        case 'price-low-high':
          filtered.sort((a, b) => getReasonablePrice(a.price) - getReasonablePrice(b.price));
          break;
        case 'price-high-low':
          filtered.sort((a, b) => getReasonablePrice(b.price) - getReasonablePrice(a.price));
          break;
        case 'rating-high-low':
          filtered.sort((a, b) => getBookRating(b) - getBookRating(a));
          break;
        case 'newest':
          // Sort by ID as a proxy for newest (since we don't have actual publish dates)
          filtered.sort((a, b) => b.id.localeCompare(a.id));
          break;
        default:
          // Default sorting (relevance) - keep original order
          break;
      }
      
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks([]);
    }
  }, [books, minPrice, maxPrice, minRating, sortBy]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (activeCategory === 'All') {
          response = await bookService.getBooks();
        } else {
          response = await bookService.getBooksByCategory(activeCategory);
        }

        if (response?.data?.products && Array.isArray(response.data.products)) {
          const formattedBooks = response.data.products.map(book => ({
            id: book._id,
            title: book.title || 'Untitled Book',
            description: book.description || `By ${book.author}`,
            price: book.price || 29.99,
            originalPrice: book.originalPrice || 39.99,
            image: book.image || '/path-to-default-image.jpg',
            author: book.author,
            pages: book.pages
          }));
          setBooks(formattedBooks); // Show all books
        } else {
          setError('No books found for this category');
        }
      } catch (err) {
        console.error('Error fetching books by category:', err);
        setError('Failed to fetch books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [activeCategory]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50 animate-fade-in-out">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">{notification.bookTitle}</p>
              <p className="text-sm">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main layout with sidebar and content */}
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar filters */}
        <div className="lg:w-64 flex-shrink-0 mb-6 lg:mb-0 lg:mr-8">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Filters</h2>
              <button 
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear
              </button>
            </div>
            
            {/* Price filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Price</h3>
              <div className="px-2">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">₹{minPrice}</span>
                  <span className="text-sm">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-4"
                />
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            {/* Category filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      id={`category-${category}`}
                      type="radio"
                      name="category"
                      checked={activeCategory === category}
                      onChange={() => setActiveCategory(category)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Rating filter */}
            <div>
              <h3 className="font-medium mb-3">Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1, 0].map((rating) => (
                  <div key={rating} className="flex items-center">
                    <input
                      id={`rating-${rating}`}
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`rating-${rating}`} className="ml-2 flex items-center">
                      {rating > 0 ? (
                        <>
                          <div className="flex">
                            {Array(rating).fill().map((_, i) => (
                              <svg key={i} className="w-4 h-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-1">& up</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-600">All ratings</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          {/* Header with title and sort */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Showing All Products</h1>
              <p className="text-sm text-gray-600">
                {filteredBooks.length} results found
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <label htmlFor="sort" className="text-sm mr-2">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating-high-low">Rating: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          
          {/* Books grid */}
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
              {error}
              <button 
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  // Retry fetching books
                  const fetchBooks = async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      
                      let response;
                      if (activeCategory === 'All') {
                        response = await bookService.getBooks();
                      } else {
                        response = await bookService.getBooksByCategory(activeCategory);
                      }

                      if (response?.data?.products && Array.isArray(response.data.products)) {
                        const formattedBooks = response.data.products.map(book => ({
                          id: book._id,
                          title: book.title || 'Untitled Book',
                          description: book.description || `By ${book.author}`,
                          price: book.price || 29.99,
                          originalPrice: book.originalPrice || 39.99,
                          image: book.image || '/path-to-default-image.jpg',
                          author: book.author,
                          pages: book.pages
                        }));
                        setBooks(formattedBooks);
                      }
                    } catch (err) {
                      setError('Failed to fetch books. Please try again later.');
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchBooks();
                }}
                className="ml-4 text-sm underline hover:text-red-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center text-gray-600 p-8 bg-white rounded-lg shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium mb-2">No books found with the selected filters</p>
              <button 
                onClick={resetFilters} 
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => {
                const rating = getBookRating(book);
                const price = getReasonablePrice(book.price);
                const originalPrice = getOriginalPrice(price);
                
                return (
                  <div key={book.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                    <div className="relative p-4 flex justify-center">
                      <img
                        src={book.image}
                        alt={book.title}
                        className="h-48 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/128x192.png?text=No+Cover';
                        }}
                      />
                      <button 
                        className="absolute top-2 right-2 p-1 rounded-full bg-white shadow hover:bg-gray-100"
                        aria-label="Add to wishlist"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 border-t">
                      <div className="flex items-center mb-1">
                        <div className="flex mr-1">
                          {renderStars(rating)}
                        </div>
                        <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1 truncate">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{book.author}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold">₹{price.toFixed(0)}</span>
                          <span className="text-sm text-gray-500 line-through ml-2">₹{originalPrice.toFixed(0)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(book)}
                        className="w-full mt-3 py-2 bg-blue-600 text-white rounded text-center hover:bg-blue-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreBooks;