import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookService from '../services/bookService';
import { BackgroundGradient } from './ui/background-gradient';
import imageUtils from '../utils/imageUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Minus, Plus, Heart, Star, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'; 
import { toast } from 'react-hot-toast';

const ProductDetails = ({ onAddToCart, onAddToWishlist }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('Hardcover');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [isFormatOpen, setIsFormatOpen] = useState(false);

  const formats = [
    { id: 'hardcover', name: 'Hardcover', price: 0 },
    { id: 'paperback', name: 'Paperback', price: -100 },
    { id: 'ebook', name: 'eBook', price: -200 }
  ];

  const currentPrice = book ? book.price + (formats.find(f => f.name === selectedFormat)?.price || 0) : 0;

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) {
        setError('No book ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching book details for ID:', id);
        const bookData = await bookService.getBookById(id);
        console.log('Book details response:', bookData);
        
        if (bookData.error) {
          throw new Error(bookData.errorMessage || 'Failed to load book details');
        }
        
        setBook(bookData);
      } catch (error) {
        console.error('Error fetching book details:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load book details. Please try again later.';
        setError(errorMessage);
        toast.error(errorMessage, { position: 'bottom-center' });
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (book) {
      onAddToCart({
        id: book._id || book.id,
        title: book.title,
        author: book.author,
        price: currentPrice,
        image: book.image,
        quantity: quantity,
        format: selectedFormat
      });
    }
  };

  const handleAddToWishlist = () => {
    if (book) {
      onAddToWishlist({
        id: book._id || book.id,
        title: book.title,
        author: book.author,
        price: currentPrice,
        image: book.image,
        format: selectedFormat
      });
    }
  };

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  const fetchRecommendedBooks = async () => {
    try {
      const response = await axios.get(`/books/recommended?genre=${book.genre}&limit=4`);
      setRecommendedBooks(response.data);
    } catch (error) {
      console.error('Error fetching recommended books:', error);
    }
  };

  useEffect(() => {
    if (book) {
      fetchRecommendedBooks();
    }
  }, [book]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            {error || 'We couldn\'t load the book details. Please try again later.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8">
          {/* Book Image */}
          <div className="flex justify-center items-start">
            <div className="relative w-full max-w-md">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-auto rounded-lg shadow-lg border border-gray-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = imageUtils.getRandomFallbackImage();
                }}
              />
              {book.isNewRelease && (
                <span className="absolute top-4 left-4 bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
                  New Release
                </span>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-serif font-light tracking-tight text-gray-900 mb-2">{book.title}</h1>
              <p className="text-lg text-gray-600">by {book.author}</p>

              <div className="flex items-center mt-4 space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(book.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {book.reviewCount ? `(${book.reviewCount} reviews)` : '(No reviews yet)'}
                </span>
              </div>
            </div>

            <div className="py-4 border-t border-b border-gray-100">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-serif font-light">₹{currentPrice.toLocaleString()}</span>
                {book.originalPrice && currentPrice < book.originalPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    ₹{book.originalPrice.toLocaleString()}
                  </span>
                )}
                {book.originalPrice && (
                  <span className="text-sm text-green-600 ml-2">
                    {Math.round((1 - currentPrice / book.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>
              <p className="text-sm text-green-600 mt-1">Free delivery above ₹499 | 3–5 business days</p>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Select Format</label>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                  onClick={() => setIsFormatOpen(!isFormatOpen)}
                >
                  What's my format? {isFormatOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>
              </div>

              {isFormatOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">Format Guide:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="font-medium">Hardcover:</span> Physical book with hard cover</li>
                    <li><span className="font-medium">Paperback:</span> Physical book with soft cover</li>
                    <li><span className="font-medium">eBook:</span> Digital version for e-readers</li>
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {formats.map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => setSelectedFormat(format.name)}
                    className={`py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                      selectedFormat === format.name
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {format.name}
                    {format.price !== 0 && (
                      <span className="ml-1 text-xs">
                        {format.price > 0 ? `+₹${format.price}` : `-₹${Math.abs(format.price)}`}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={incrementQuantity}
                  disabled={quantity >= 10}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 pt-4">
              <button
                onClick={() => {
                  toast.success('Purchase successful! Thank you for your order.', { position: 'top-center' });
                }}
                className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white py-3 px-8 rounded-lg shadow-lg hover:from-pink-600 hover:to-yellow-600 transition-all font-semibold text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
                style={{ boxShadow: '0 4px 14px 0 rgba(255, 193, 7, 0.15)' }}
              >
                Buy Now • ₹{(currentPrice * quantity).toLocaleString()}
              </button>
              <button
                onClick={handleAddToCart}
                className="bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                Add to Cart
              </button>
              <button
                onClick={handleAddToWishlist}
                className="flex items-center justify-center space-x-2 py-3 px-6 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <Heart className="w-5 h-5" />
                <span>Add to Wishlist</span>
              </button>
            </div>

            {/* Delivery Info */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Free delivery</span> on orders over ₹499. Order now and get it by {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-t border-gray-100 px-8 py-6">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger
                value="description"
                className={`${activeTab === 'description' ? 'text-black' : 'text-gray-500'}`}
                onClick={() => setActiveTab('description')}
              >
                <span className="font-bold">Description</span>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className={`${activeTab === 'details' ? 'text-black' : 'text-gray-500'}`}
                onClick={() => setActiveTab('details')}
              >
                <span className="font-bold">Details</span>
              </TabsTrigger>
              <TabsTrigger
                value="author"
                className={`${activeTab === 'author' ? 'text-black' : 'text-gray-500'}`}
                onClick={() => setActiveTab('author')}
              >
                <span className="font-bold">About the Author</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="description" className="mt-0">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {book.description || 'No description available.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {book.publisher && (
                      <div className="flex">
                        <span className="w-32 text-gray-500">Publisher</span>
                        <span className="text-gray-900">{book.publisher}</span>
                      </div>
                    )}
                    {book.isbn && (
                      <div className="flex">
                        <span className="w-32 text-gray-500">ISBN</span>
                        <span className="text-gray-900">{book.isbn}</span>
                      </div>
                    )}
                    {book.language && (
                      <div className="flex">
                        <span className="w-32 text-gray-500">Language</span>
                        <span className="text-gray-900">{book.language}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {book.genre && (
                      <div className="flex">
                        <span className="w-32 text-gray-500">Genre</span>
                        <span className="text-gray-900">{book.genre}</span>
                      </div>
                    )}
                    {book.pages && (
                      <div className="flex">
                        <span className="w-32 text-gray-500">Pages</span>
                        <span className="text-gray-900">{book.pages.toLocaleString()}</span>
                      </div>
                    )}
                    {book.publishedDate && (
                      <div className="flex">
                        <span className="w-32 text-gray-500">Published</span>
                        <span className="text-gray-900">
                          {new Date(book.publishedDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="author" className="mt-0">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                      {book.authorImage ? (
                        <img
                          src={book.authorImage}
                          alt={book.author}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-2xl">
                          {book.author ? book.author.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{book.author}</h3>
                    <p className="mt-2 text-gray-600">
                      {book.authorBio || 'Author bio not available.'}
                    </p>
                    {book.authorWebsite && (
                      <a
                        href={book.authorWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-600 hover:underline text-sm"
                      >
                        Visit author's website
                      </a>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Recommended Books */}
      {recommendedBooks.length > 0 && (
        <div className="mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-light text-gray-900">You May Also Like</h2>
            <button
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              onClick={() => navigate('/explore')}
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedBooks.map((recBook) => (
              <div
                key={recBook._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/product/${recBook._id}`)}
              >
                <div className="aspect-[2/3] bg-gray-50 rounded-lg overflow-hidden mb-3 relative">
                  <img
                    src={recBook.image}
                    alt={recBook.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = imageUtils.getRandomFallbackImage();
                    }}
                  />
                </div>
                <h3 className="font-medium text-gray-900 line-clamp-2">{recBook.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{recBook.author}</p>
                <p className="text-gray-900 font-medium mt-1">₹{recBook.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;