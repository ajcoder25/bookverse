import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/apiConfig';
import { BackgroundGradient } from './ui/background-gradient';
import imageUtils from '../utils/imageUtils';


const ProductDetails = ({ onAddToCart, onAddToWishlist }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/books/${id}`);
        setBook(response.data);
      } catch (error) {
        console.error('Error fetching book details:', error);
        setError('Failed to load book details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (book) {
      onAddToCart({
        id: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        image: book.image,
        quantity: 1
      });
      setNotification({
        type: 'success',
        message: 'Added to cart successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddToWishlist = () => {
    if (book) {
      onAddToWishlist({
        id: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        image: book.image
      });
      setNotification({
        type: 'success',
        message: 'Added to wishlist successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/explore')}
          className="text-blue-600 hover:underline"
        >
          Return to Explore Books
        </button>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Book not found</p>
        <button
          onClick={() => navigate('/explore')}
          className="text-blue-600 hover:underline"
        >
          Return to Explore Books
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <BackgroundGradient className="bg-white rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Book Image */}
          <div className="flex justify-center items-start">
            <img
              src={book.image}
              alt={book.title}
              className="max-w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = imageUtils.getRandomFallbackImage();
              }}
            />
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
            <p className="text-xl text-gray-600">by {book.author}</p>
            
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold">₹{book.price}</span>
              {book.originalPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ₹{book.originalPrice}
                </span>
              )}
            </div>

            {book.rating && (
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(book.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600">({book.rating} / 5)</span>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="text-gray-700 leading-relaxed">
                {book.description || 'No description available.'}
              </p>
            </div>

            {book.pages && (
              <div className="text-gray-600">
                <span className="font-medium">Pages:</span> {book.pages}
              </div>
            )}

            {book.genre && (
              <div className="text-gray-600">
                <span className="font-medium">Genre:</span> {book.genre}
              </div>
            )}

            <div className="flex space-x-4 pt-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add to Cart
              </button>
              <button
                onClick={handleAddToWishlist}
                className="flex-1 border-2 border-black text-black py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>
      </BackgroundGradient>
    </div>
  );
};

export default ProductDetails;