import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';
import bookService from '../services/bookService';
import fallbackBookImages from '../assets/fallbackBookImages.json';

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
  return <div className="flex items-center gap-0.5">{stars} <span className="text-xs text-gray-500 ml-1">({rating})</span></div>;
};

// Helper to get the best quality image from the book object (copied from ProductList)
const getBestBookImage = (book) => {
  if (!book) return 'https://via.placeholder.com/400x600.png?text=No+Cover';
  if (book.imageLinks) {
    return (
      book.imageLinks.extraLarge ||
      book.imageLinks.large ||
      book.imageLinks.medium ||
      book.imageLinks.thumbnail ||
      book.imageLinks.smallThumbnail ||
      fallbackBookImages[book.id] ||
      'https://via.placeholder.com/400x600.png?text=No+Cover'
    );
  }
  if (book.image && !book.image.includes('not+available')) return book.image.replace('zoom=1', 'zoom=2');
  if (fallbackBookImages[book.id]) return fallbackBookImages[book.id];
  return 'https://via.placeholder.com/400x600.png?text=No+Cover';
};

const Home = ({ onAddToCart, onAddToWishlist }) => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { name: "Fiction", count: 1250 },
    { name: "Science", count: 427 },
    { name: "History", count: 539 },
    { name: "Biography", count: 312 },
    { name: "Business", count: 672 },
    { name: "Romance", count: 892 },
    { name: "Fantasy", count: 445 },
    { name: "Mystery", count: 567 }
  ];

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await bookService.searchBooks({
          query: 'business books',
          maxResults: 8
        });

        if (response.books) {
          setFeaturedBooks(response.books);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const validBooks = featuredBooks.filter(book => {
    const img = getBestBookImage(book);
    if (!img) return false;
    const lowerImg = img.toLowerCase();
    return !(
      lowerImg.includes('not+available') ||
      lowerImg.includes('placeholder.com/400x600') ||
      lowerImg.includes('placeholder.com/300x400') ||
      lowerImg.includes('placeholder.com/128x192') ||
      lowerImg.includes('placeholder') ||
      lowerImg.endsWith('.svg') ||
      lowerImg.includes('image not available')
    );
  });

  const BookCard = ({ book }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 relative">
      <button
        onClick={() => onAddToWishlist(book)}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white"
      >
        <HeartIcon filled={book.isInWishlist} />
      </button>
      
      <Link to={`/book/${book.id}`} className="block">
        <div className="aspect-[3/4] relative rounded-t-lg overflow-hidden">
          <img
            src={getBestBookImage(book) || 'https://via.placeholder.com/400x600.png?text=No+Cover'}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x600.png?text=No+Cover';
            }}
          />
        </div>
        
        <div className="p-4">
          <StarRating rating={book.rating || 4.5} />
          <h3 className="text-sm font-medium mt-2 line-clamp-2 min-h-[2.5rem]">
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-1">
            {book.author}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold">₹{book.price || 798.80}</span>
            {book.originalPrice && (
              <span className="text-sm text-gray-400 line-through">₹{book.originalPrice}</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(book);
            }}
            className="w-full mt-3 bg-black text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </Link>
    </div>
  );

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Discover Your Next Favorite Book
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Explore our vast collection of books across various genres. From timeless classics
              to contemporary bestsellers, find the perfect read for you.
            </p>
            <Link
              to="/explore"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start Exploring
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Books */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Books</h2>
          <Link
            to="/explore"
            className="text-blue-600 hover:underline"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {validBooks.map((book) => (
              <div key={book.id} className="flex flex-col items-center bg-white rounded-lg shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
                <Link to={`/book/${book.id}`} className="group w-full">
                  <div className="flex flex-col items-center">
                    <img
                      src={getBestBookImage(book) || 'https://via.placeholder.com/400x600.png?text=No+Cover'}
                      alt={book.title}
                      style={{ width: '140px', height: '210px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
                      className="transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x600.png?text=No+Cover';
                      }}
                    />
                    <div className="w-full mt-3 text-center">
                      <h3 className="font-semibold text-base mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5em]">{book.title}</h3>
                      <p className="text-xs text-gray-500 mb-1 line-clamp-1">{book.author}</p>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2 min-h-[2.5em]">{book.description || 'No description available.'}</p>
                    </div>
                  </div>
                </Link>
                <div className="mt-2 flex items-center justify-between w-full">
                  <span className="font-bold text-base">₹{book.price || 798.80}</span>
                  <button
                    onClick={() => onAddToCart(book)}
                    className="bg-black text-white px-4 py-1 text-sm rounded hover:bg-gray-800 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/explore?category=${category.name.toLowerCase()}`}
                className="group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 mt-1">{category.count} Books</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-8">
              Subscribe to our newsletter to receive updates about new books,
              exclusive offers, and reading recommendations.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 flex-grow max-w-md"
              />
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 