import React, { useState, useEffect } from 'react';
import BookCard from './BookCard';
import bookService from '../services/bookService';
import { useCart } from '../context/CartContext';

const Home = ({ onAddToWishlist, wishlist = [] }) => {
  const { addToCart, cartItems } = useCart();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = [
    'All', 'Fiction', 'Science', 'History', 'Biography', 'Business', 'Romance', 'Fantasy', 'Mystery'
  ];

  useEffect(() => {
    handleCategoryChange(selectedCategory);
  }, [selectedCategory]);

  // Remove local handlers, use props
  
  // Add a function to force refresh the data
  const refreshBooks = () => {
    handleCategoryChange(selectedCategory);
  };

  // Handle category change
  const handleCategoryChange = async (category, retryCount = 0) => {
    console.log(`Category changed to: ${category}, retry count: ${retryCount}`);
    setSelectedCategory(category);
    setLoading(true);
    setError(null);
    
    try {
      let books = [];
      
      try {
        if (category === 'All') {
          console.log('Fetching featured books...');
          books = await bookService.getFeaturedBooks(12);
        } else {
          console.log(`Fetching books in category: ${category}`);
          books = await bookService.getBooksByCategory(category, 12);
        }
        
        console.log('Fetched books:', books);
        
        // If no books found, try with a broader search
        if (books.length === 0 && retryCount < 1) {
          console.log('No books found, trying broader search...');
          return handleCategoryChange(category, retryCount + 1);
        }
      } catch (apiError) {
        console.error('Error fetching books:', apiError);
        throw apiError;
      }
      
      setBooks(books);
      
      // If still no books, show error
      if (books.length === 0) {
        throw new Error('No books available');
      }
      
    } catch (err) {
      console.error('Error in handleCategoryChange:', err);
      setError({
        message: 'Failed to load books. Please try again later.',
        category,
        retry: () => handleCategoryChange(category)
      });
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    handleCategoryChange('All');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters - Centered */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-black font-sans mb-6">Browse by Category</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-800 border border-gray-300 hover:bg-blue-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load {error.category ? `${error.category} books` : 'books'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={error.retry || (() => handleCategoryChange(selectedCategory))}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Book Grid */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory === 'All' ? 'Featured Books' : `${selectedCategory} Books`}
            </h2>
             {(() => {
               // Robustly extract all possible book IDs from cart items
               const extractBookId = (item) => {
                 if (!item) return null;
                 if (typeof item.book === 'string' || typeof item.book === 'number') return String(item.book);
                 return String(
                   item.bookId || item.id || item._id ||
                   (item.book && (item.book._id || item.book.id || item.book.bookId))
                 );
               };
               const cartBookIds = new Set((cartItems || []).map(extractBookId));
               const visibleBooks = books.filter(book => {
                 const bookId = String(book.id || book._id || book.bookId);
                 return !cartBookIds.has(bookId);
               });
               return visibleBooks.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {visibleBooks.map((book) => (
                     <BookCard
                       key={book.id || book._id}
                       book={book}
                       onAddToCart={addToCart}
                       onAddToWishlist={onAddToWishlist}
                       wishlist={wishlist}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12 bg-white rounded-lg shadow">
                   <p className="text-gray-600">No books found in this category.</p>
                   <button
                     onClick={() => handleCategoryChange(selectedCategory)}
                     className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                   >
                     Retry
                   </button>
                 </div>
               );
             })()}
        </div>
      )}
    </main>
  </div>
  );
};

export default Home;
