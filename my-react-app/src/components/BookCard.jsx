import React from 'react';
import { FaHeart, FaStar, FaShoppingCart } from 'react-icons/fa';


import toast from 'react-hot-toast';

const BookCard = ({ book, onAddToCart, onAddToWishlist, wishlist = [] }) => {
    // Compute wishlist status directly from props for each render
  // Defensive: compare both id and _id, handle both string and number
// More robust: check all possible ID fields
const normalizeId = (id) => (id ? id.toString() : '');
// Only wishlists the current book by robustly comparing all possible ID fields
const isWishlisted = wishlist.some(
  (b) => {
    const bookId = normalizeId(book.id || book._id || book.bookId);
    return (
      normalizeId(b.id) === bookId ||
      normalizeId(b._id) === bookId ||
      normalizeId(b.bookId) === bookId ||
      (b.book && (
        normalizeId(b.book) === bookId ||
        normalizeId(b.book.id) === bookId ||
        normalizeId(b.book._id) === bookId ||
        normalizeId(b.book.bookId) === bookId
      ))
    );
  }
);



  
  // Helper function to handle image error
  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/160x200?text=No+Image';
  };

  // Safely access book data with fallbacks
  const volumeInfo = book.volumeInfo || {};
  const saleInfo = book.saleInfo || {};
  const imageLinks = volumeInfo.imageLinks || {};
  
  // Safely extract prices
  const getPrice = (priceObj) => {
    if (!priceObj) return null;
    return typeof priceObj === 'object' ? priceObj.amount : priceObj;
  };

  // Calculate prices with fallbacks
  const listPriceAmount = getPrice(saleInfo.listPrice) || 
                       (getPrice(saleInfo.retailPrice) * 1.25) || 
                       (Math.floor(Math.random() * 2000) + 500);
  
  const salePriceAmount = getPrice(saleInfo.retailPrice) || 
                        (getPrice(saleInfo.listPrice) * 0.8) || 
                        Math.floor(listPriceAmount * 0.8);
  
  const discount = Math.round(((listPriceAmount - salePriceAmount) / listPriceAmount) * 100);
  
  // Format price
  const formatPrice = (price) => {
    if (!price && price !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get first author or default
  const author = volumeInfo.authors?.[0] || 'Unknown Author';
  
  // Truncate description
  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'No description available';
    const cleanText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return cleanText.length > maxLength ? `${cleanText.substring(0, maxLength)}...` : cleanText;
  };
  
  // Generate a simple SVG placeholder with book title
  const generatePlaceholderSVG = (title) => {
    const text = title?.substring(0, 20) || 'No Cover';
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              text-anchor="middle" fill="#666" dy=".3em">${text}</text>
      </svg>`
    )}`;
  };

  // Get book cover image
  const getBookCover = () => {
    // First, try to use the direct image URL if available
    if (book.image) {
      return book.image;
    }
    
    // Try the image from volumeInfo
    if (volumeInfo?.image) {
      return volumeInfo.image;
    }
    
    // Fallback to image links
    if (volumeInfo?.imageLinks?.thumbnail) {
      return volumeInfo.imageLinks.thumbnail;
    }
    
    if (volumeInfo?.imageLinks?.smallThumbnail) {
      return volumeInfo.imageLinks.smallThumbnail;
    }
    
    // If no image is available, generate an SVG placeholder
    return generatePlaceholderSVG(volumeInfo?.title || 'Book Title');
  };

  // Log book data for debugging
  const handleBookClick = (e) => {
    e.preventDefault();
    console.log('Book data:', book);
    // Navigate to the product page
    window.location.href = `/product/${book.id || book._id || ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative h-64 bg-gray-100">
        <div className="relative w-full h-full">
          {/* Book Cover Image */}
          <div 
            onClick={handleBookClick}
            className="block w-full h-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
          >
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={getBookCover()}
                  alt={volumeInfo.title || 'Book Cover'}
                  className="w-full h-full object-contain"
                  style={{
                    maxHeight: '280px',
                    width: 'auto',
                    height: 'auto',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#f8f9fa'
                  }}
                  onError={(e) => {
                    // If image fails to load, try the small thumbnail
                    if (imageLinks?.smallThumbnail && e.target.src !== imageLinks.smallThumbnail) {
                      e.target.src = imageLinks.smallThumbnail;
                    } else {
                      // If still fails, generate an SVG placeholder
                      e.target.src = generatePlaceholderSVG(volumeInfo?.title);
                    }
                  }}
                  loading="lazy"
                />
                {(!imageLinks?.thumbnail && !imageLinks?.smallThumbnail) && (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-gray-500 text-sm">
                    Cover not available
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Wishlist Button */}
          <button 
            className={`absolute top-2 right-2 bg-white rounded-full p-2 shadow-md transition-colors z-10 ${isWishlisted ? 'bg-red-50' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isWishlisted) {
                onAddToWishlist(book, 'remove');
              } else {
                onAddToWishlist(book, 'add');
              }
              // UI will update on prop/state change from parent
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FaHeart className={isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} />
          </button>
          
          {/* Discount Badge */}
          {discount > 0 && discount < 100 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {discount}% OFF
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div onClick={handleBookClick} className="block flex-grow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {book.volumeInfo?.title || 'Untitled'}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{author}</p>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                fill={star <= 4 ? 'currentColor' : 'none'}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              ({Math.floor(Math.random() * 100)})
            </span>
          </div>

          {/* Description */}
          {book.volumeInfo?.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {truncateText(book.volumeInfo.description, 100)}
            </p>
          )}
        </div>

        {/* Price and Rating */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{formatPrice(salePriceAmount)}</span>
          {listPriceAmount > salePriceAmount && (
            <span className="ml-2 text-sm text-gray-500 line-through">
              {formatPrice(listPriceAmount)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="mt-3">
          <button
            onClick={async (e) => {
              e.preventDefault();
              // Map book object to backend cart schema
              const mappedBook = {
                bookId: book.id || book._id,
                title: book.volumeInfo?.title || book.title,
                author: (book.volumeInfo?.authors && book.volumeInfo.authors[0]) || book.author || 'Unknown Author',
                image: (book.volumeInfo?.imageLinks?.thumbnail || book.image || ''),
                price: book.price || salePriceAmount || 299, // fallback price
                quantity: 1
              };
              const result = await onAddToCart(mappedBook);
              if (result && result.success) {
                toast.success('📚 Book successfully added to cart!', { position: 'top-center' });
              }
            }}
            className="w-full bg-black hover:bg-gray-900 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center font-sans"
          >
            <FaShoppingCart className="mr-2" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
