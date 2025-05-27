import React from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = ({ cartItems, removeFromCart }) => {
  const navigate = useNavigate();
  
  // Calculate subtotal
  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Handle checkout
  const handleCheckout = () => {
    alert('Proceeding to checkout...');
    // Here you would typically redirect to a checkout page
  };
  
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="border-t border-gray-200">
            {cartItems.map((item) => (
              <div key={item.id} className="py-6 flex border-b border-gray-200">
                <div className="flex-shrink-0 w-24 h-32 overflow-hidden rounded-md">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/128x192.png?text=No+Cover';
                    }}
                  />
                </div>
                
                <div className="ml-6 flex-1 flex flex-col">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.author}</p>
                      <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-lg font-medium text-gray-900">₹{item.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex-1 flex items-end justify-between">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-black hover:text-gray-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                <p>Subtotal</p>
                <p>₹{subtotal.toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500 mb-6">Shipping and taxes will be calculated at checkout.</p>
              <button
                onClick={handleCheckout}
                className="w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                Checkout
              </button>
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-black hover:text-gray-700 text-sm font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart; 