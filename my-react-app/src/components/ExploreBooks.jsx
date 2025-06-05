import React from 'react';
import ProductList from './ProductList';

const ExploreBooks = ({ onAddToCart, onAddToWishlist }) => {
  return (
    <div>
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
          </div>
        </div>
      </div>

      <ProductList onAddToCart={onAddToCart} onAddToWishlist={onAddToWishlist} />
    </div>
  );
};

export default ExploreBooks;