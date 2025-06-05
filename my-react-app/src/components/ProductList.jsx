import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';
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
    const filled = index < Math.floor(rating);
    return (
      <span key={index} className={`text-sm ${filled ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    );
  });
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

const ProductList = ({ onAddToCart, onAddToWishlist }) => {
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Fiction', value: 'fiction' },
    { label: 'Science', value: 'science' },
    { label: 'History', value: 'history' },
    { label: 'Biography', value: 'biography' },
    { label: 'Business', value: 'business' },
    { label: 'Romance', value: 'romance' },
    { label: 'Fantasy', value: 'fantasy' },
    { label: 'Mystery', value: 'mystery' }
  ];

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        const searchQuery = searchParams.get('q');
        const response = await bookService.searchBooks({
          query: searchQuery || selectedCategory === 'all' ? 'best sellers' : selectedCategory,
          maxResults: 6  // Set maxResults to 6 for all categories
        });

        if (response.books) {
          // Ensure exactly 6 books are shown for all categories
          setBooks(response.books.slice(0, 6));
        } else {
          setError('No books found matching your criteria.');
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Failed to load books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchParams, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const { addToCart } = useCart();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Categories */}
      <div className="flex justify-center gap-4 mb-8 overflow-x-auto py-2">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === category.value
                ? 'bg-black text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <BackgroundGradient key={book.id} className="group rounded-xl">
            <div className="h-full bg-white rounded-xl p-4 flex flex-col">
              <Link to={`/book/${book.id}`} className="flex-grow">
                  <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg">
                    <img
                      src={book.image || imageUtils.getRandomFallbackImage()}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = imageUtils.getRandomFallbackImage();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <StarRating rating={book.rating || 4} />
                  <p className="text-lg font-bold text-gray-900">₹{book.price || 798.80}</p>
                </div>
              </Link>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => onAddToCart(book)}
                  className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => onAddToWishlist(book)}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                  title="Add to Wishlist"
                >
                  <HeartIcon filled={false} />
                </button>
              </div>
            </div>
          </BackgroundGradient>
        ))}
      </div>

      {books.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {error || 'No books found matching your criteria.'}
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-blue-600 hover:underline"
          >
            View all books
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
