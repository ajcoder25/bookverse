import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';

const CheckoutSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <div className="container mx-auto px-4 py-16">
      <BackgroundGradient className="max-w-2xl mx-auto bg-white rounded-xl p-8 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-2">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          {orderId && (
            <p className="text-gray-600">
              Order ID: <span className="font-medium">{orderId}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            We'll send you an email with your order details and tracking information once
            your order ships.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              to="/profile"
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              View Order Status
            </Link>
            <Link
              to="/explore"
              className="border-2 border-black text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </BackgroundGradient>
    </div>
  );
};

export default CheckoutSuccess; 