import React, { useState, useEffect } from 'react';
import BookCard from './BookCard';
import bookService from '../services/bookService';
import imageUtils from '../utils/imageUtils';
import { useCart } from '../context/CartContext';

const HeartIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    />
  </svg>
);

const StarRating = ({ rating }) => {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const filled = index < Math.floor(rating || 0);
    return (
      <span key={index} className={`text-sm ${filled ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    );
  });
  return <div className="flex items-center gap-0.5">{stars} <span className="text-xs text-gray-500 ml-1">({rating || 'N/A'})</span></div>;
};

// Helper to get the best quality image from the book object
const getBestBookImage = (book) => {
  if (!book) return null;
  
  // Check imageLinks first (Google Books API format)
  if (book.imageLinks) {
    return imageUtils.getBookCoverImage(book.imageLinks);
  }
  
  // Check direct image property
  if (book.image) {
    return book.image.replace('zoom=1', 'zoom=2');
  }
  
  // Return a random fallback image
  return imageUtils.getRandomFallbackImage();
};

const ExploreBooks = ({ onAddToWishlist, wishlist = [] }) => {
  const { addToCart } = useCart();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('low-high');

  const categories = [
    { name: 'All', value: 'all' },
    { name: 'Fiction', value: 'fiction' },
    { name: 'Science', value: 'science' },
    { name: 'Technology', value: 'technology' },
    { name: 'History', value: 'history' },
    { name: 'Biography', value: 'biography' },
    { name: 'Business', value: 'business' },
    { name: 'Romance', value: 'romance' },
    { name: 'Fantasy', value: 'fantasy' },
    { name: 'Mystery', value: 'mystery' },
  ];

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        let books = [];
        if (searchQuery) {
          // Search by query
          const response = await bookService.searchBooks(searchQuery, 20);
          books = response?.items || response?.books || [];
        } else if (selectedCategory === 'all') {
          // All books: show featured/bestsellers
          books = await bookService.getFeaturedBooks(20);
        } else {
          // By category
          books = await bookService.getBooksByCategory(selectedCategory, 20);
        }
        setBooks(books);
      } catch (error) {
        setBooks([]);
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [searchQuery, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    // The useEffect will trigger a new search when searchQuery changes
  };


  // Sorting logic
const sortedBooks = React.useMemo(() => {
  if (!books) return [];
  const getPrice = (book) => {
    // Try to get the price from saleInfo, fallback to 0
    if (book.saleInfo && book.saleInfo.retailPrice && book.saleInfo.retailPrice.amount)
      return book.saleInfo.retailPrice.amount;
    if (book.saleInfo && book.saleInfo.listPrice && book.saleInfo.listPrice.amount)
      return book.saleInfo.listPrice.amount;
    if (typeof book.price === 'number') return book.price;
    return 0;
  };
  const sorted = [...books].sort((a, b) => {
    const priceA = getPrice(a);
    const priceB = getPrice(b);
    if (sortOrder === 'low-high') return priceA - priceB;
    else return priceB - priceA;
  });
  return sorted;
}, [books, sortOrder]);

return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Explore Our Collection
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover a vast collection of books across various genres. From timeless classics
              to contemporary bestsellers, find your next great read here.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or keyword"
                  className="flex-1 px-4 py-3 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-6 py-3 rounded-r-lg hover:bg-gray-800 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.value}>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.value);
                        setSearchQuery(''); // Clear search if changing category
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedCategory === category.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Book Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedCategory === 'all' ? 'All Books' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Books`}
              </h2>
              <p className="text-gray-600">
                {books.length} {books.length === 1 ? 'book' : 'books'} found
              </p>
            </div>

            {/* Price Sort UI */}
<div className="flex items-center justify-end mb-6">
  <div className="bg-white shadow rounded-lg px-4 py-2 flex items-center gap-4">
    <span className="font-medium text-gray-700 mr-2">Sort by Price:</span>
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="radio"
        className="form-radio text-blue-600"
        name="sortPrice"
        value="low-high"
        checked={sortOrder === 'low-high'}
        onChange={() => setSortOrder('low-high')}
      />
      <span className="ml-2 text-sm text-gray-700">Low to High</span>
    </label>
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="radio"
        className="form-radio text-blue-600"
        name="sortPrice"
        value="high-low"
        checked={sortOrder === 'high-low'}
        onChange={() => setSortOrder('high-low')}
      />
      <span className="ml-2 text-sm text-gray-700">High to Low</span>
    </label>
  </div>
</div>

{loading ? (
  <div className="flex justify-center items-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
) : books.length > 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {sortedBooks.map((book) => (
      <BookCard
        key={book.id || book._id}
        book={book}
        onAddToCart={addToCart}
        onAddToWishlist={onAddToWishlist}
        wishlist={wishlist || []}
      />
    ))}
  </div>
) : (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg">No books found. Try a different search or category.</p>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreBooks;