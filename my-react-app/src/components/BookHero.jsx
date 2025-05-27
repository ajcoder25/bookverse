import React, { useState, useEffect } from 'react';
import bookService from '../api/bookService';
import { BackgroundGradient } from './ui/background-gradient';

const BookHero = ({ searchResults, onSearchResults, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState('Featured Books');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['Featured Books', 'Best selling', 'NewRelease'];

  // Convert USD to INR with a more reasonable price range
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

  useEffect(() => {
    // Debug log for search results
    console.log('Search results received:', searchResults);

    // If there are search results, use them instead of fetching by category
    if (searchResults && searchResults.length > 0) {
      try {
        // Extract the search query from the first result if available
        if (searchResults[0]?.volumeInfo?.title) {
          setSearchQuery(searchResults[0].volumeInfo.title.split(' ')[0]);
        }
        
        const formattedBooks = searchResults.map(book => ({
          id: book.id,
          title: book.volumeInfo?.title || 'Untitled Book',
          description: book.volumeInfo?.description?.substring(0, 150) + '...' || 
                      `By ${book.volumeInfo?.authors?.join(', ') || 'Unknown Author'}`,
          price: book.saleInfo?.retailPrice?.amount || 29.99,
          originalPrice: book.saleInfo?.listPrice?.amount || 39.99,
          image: book.volumeInfo?.imageLinks?.thumbnail || 
                book.volumeInfo?.imageLinks?.smallThumbnail || 
                '/path-to-default-image.jpg',
          author: book.volumeInfo?.authors?.join(', ') || 'Unknown Author',
          pages: book.volumeInfo?.pageCount
        }));
        console.log('Formatted search results:', formattedBooks);
        setBooks(formattedBooks.slice(0, 6)); // Limit to 6 books
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error formatting search results:', err);
        setError('Error displaying search results. Please try again.');
        setLoading(false);
      }
      return;
    }

    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        switch(activeCategory) {
          case 'Featured Books':
            response = await bookService.getFeaturedBooks();
            break;
          case 'Best selling':
            response = await bookService.getBestsellingBooks();
            break;
          case 'NewRelease':
            response = await bookService.getNewReleases();
            break;
          default:
            response = await bookService.getBooks();
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
          setBooks(formattedBooks.slice(0, 6)); // Limit to 6 books
        } else {
          setError('No books found for this category');
        }
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to fetch books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [activeCategory, searchResults]);

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
      
      {/* Show heading for all views */}
      <div className="text-center mb-8 sm:mb-10 lg:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-bold mb-4 sm:mb-5 lg:mb-6 text-[#1a1a1a] max-w-3xl mx-auto px-4">
          Best Book Deals, Curated for You
        </h1>
        <p className="text-[#666] text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-4">
          Your ultimate destination to discover, explore, and get lost in the world of books
        </p>
      </div>

      {/* Always show category buttons */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 px-2 sm:px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              if (searchResults) {
                // Clear search results when switching to a category
                onSearchResults(null);
              }
            }}
            className={`
              px-4 sm:px-6 py-2 rounded-full border transition-all duration-200 text-base sm:text-lg whitespace-nowrap
              ${activeCategory === category && !searchResults
                ? 'bg-black text-white border-black'
                : 'border-gray-300 hover:border-gray-600 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span className="font-medium">
              {category}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
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
                  switch(activeCategory) {
                    case 'Featured Books':
                      response = await bookService.getFeaturedBooks();
                      break;
                    case 'Best selling':
                      response = await bookService.getBestsellingBooks();
                      break;
                    case 'NewRelease':
                      response = await bookService.getNewReleases();
                      break;
                    default:
                      response = await bookService.getBooks();
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
                    setBooks(formattedBooks.slice(0, 6)); // Limit to 6 books
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
      ) : books.length === 0 ? (
        <div className="text-center text-red-500 p-4">
          No books found for this category. <button onClick={() => setActiveCategory('Featured Books')} className="underline">Try Featured Books</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
          {books.map((book) => (
            <BackgroundGradient
              key={book.id}
              className="bg-white rounded-[22px] p-4 transition-all duration-300 h-full"
              containerClassName="h-full"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="w-32 h-48 sm:w-36 sm:h-52 relative overflow-hidden rounded-md">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="object-contain w-full h-full rounded-md shadow-sm transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/128x192.png?text=No+Cover';
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{book.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-2 flex-grow">{book.description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <div>
                    <span className="text-base sm:text-lg font-bold">
                      ₹{getReasonablePrice(book.price).toFixed(2)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 line-through ml-2">
                      ₹{getOriginalPrice(getReasonablePrice(book.price)).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(book)}
                    className="rounded-full px-4 py-1 text-white bg-black hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm font-medium">Add to Cart</span>
                  </button>
                </div>
              </div>
            </BackgroundGradient>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookHero;
