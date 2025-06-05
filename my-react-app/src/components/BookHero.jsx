import React from 'react';
import { Link } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';
import imageUtils from '../utils/imageUtils';

const BookHero = ({ featuredBooks = [], onAddToCart }) => {
  const featuredBook = featuredBooks[0] || {
    id: '',
    title: 'Loading...',
    author: 'Please wait',
    description: 'Loading book details...',
    price: null,
    image: imageUtils.getRandomFallbackImage(),
    averageRating: 0,
    ratingsCount: 0
  };

  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        <BackgroundGradient className="bg-white rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-[3/4] md:aspect-auto md:h-[500px]">
              <img
                src={featuredBook.image}
                alt={featuredBook.title}
                className="absolute w-full h-full object-cover rounded-lg shadow-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = imageUtils.getRandomFallbackImage();
                }}
              />
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{featuredBook.title}</h1>
                <p className="text-xl text-gray-600">by {featuredBook.author}</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(featuredBook.averageRating || 0)
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
                <span className="text-gray-600">
                  ({featuredBook.averageRating || 0} / 5) · {featuredBook.ratingsCount || 0} reviews
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed">
                {featuredBook.description || 'No description available.'}
              </p>

              <p className="text-3xl font-bold">
                {featuredBook.price ? `₹${featuredBook.price}` : 'Price not available'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {featuredBook.id && (
                  <>
                    <Link
                      to={`/book/${featuredBook.id}`}
                      className="flex-1 bg-black text-white text-center py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => onAddToCart(featuredBook)}
                      className="flex-1 border-2 border-black text-black text-center py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </>
                )}
                <Link
                  to="/explore"
                  className="flex-1 border-2 border-black text-black text-center py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Explore More
                </Link>
              </div>
            </div>
          </div>
        </BackgroundGradient>
      </div>
    </div>
  );
};

export default BookHero;
