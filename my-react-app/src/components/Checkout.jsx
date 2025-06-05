import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';

const Checkout = ({ cart, onOrderComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [orderDetails, setOrderDetails] = useState({
    shippingAddress: '',
    paymentMethod: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved address from profile if available
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setOrderDetails(prev => ({
        ...prev,
        shippingAddress: profile.defaultAddress || '',
        email: profile.email || '',
        phone: profile.phone || ''
      }));
    }
  }, []);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return orderDetails.shippingAddress.trim() !== '';
      case 2:
        return orderDetails.paymentMethod !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
      setError(null);
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmitOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create order object
      const order = {
        items: cart,
        totalAmount: calculateTotal(),
        shippingAddress: orderDetails.shippingAddress,
        paymentMethod: orderDetails.paymentMethod,
        email: orderDetails.email,
        phone: orderDetails.phone,
        status: 'Processing',
        date: new Date().toISOString()
      };

      // Save order to localStorage
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const newOrder = {
        ...order,
        id: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`
      };
      localStorage.setItem('orders', JSON.stringify([...savedOrders, newOrder]));

      // Clear cart
      localStorage.setItem('cart', '[]');
      
      // Notify parent component
      if (onOrderComplete) {
        onOrderComplete();
      }

      // Navigate to success page
      navigate('/checkout/success', { state: { orderId: newOrder.id } });
    } catch (error) {
      console.error('Error processing order:', error);
      setError('Failed to process your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some books to your cart to proceed with checkout.</p>
          <button
            onClick={() => navigate('/explore')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Explore Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {['Shipping', 'Payment', 'Review'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step > index + 1 ? 'bg-green-500 text-white' :
                step === index + 1 ? 'bg-black text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {step > index + 1 ? '✓' : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium">{label}</span>
              {index < 2 && (
                <div className={`w-24 h-1 mx-4 ${
                  step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Content */}
        <div>
          <BackgroundGradient className="bg-white rounded-xl p-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Shipping Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={orderDetails.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={orderDetails.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Address
                  </label>
                  <textarea
                    name="shippingAddress"
                    value={orderDetails.shippingAddress}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
                <div className="space-y-2">
                  {['Credit Card', 'UPI', 'Cash on Delivery'].map((method) => (
                    <label key={method} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={orderDetails.paymentMethod === method}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-black"
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Order Review</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Shipping Address</h3>
                    <p className="text-gray-600">{orderDetails.shippingAddress}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Contact Information</h3>
                    <p className="text-gray-600">{orderDetails.email}</p>
                    <p className="text-gray-600">{orderDetails.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Payment Method</h3>
                    <p className="text-gray-600">{orderDetails.paymentMethod}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border-2 border-black text-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="ml-auto px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className="ml-auto px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              )}
            </div>
          </BackgroundGradient>
        </div>

        {/* Order Summary */}
        <div>
          <BackgroundGradient className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-20 object-cover rounded"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/64x80.png?text=No+Cover';
                    }}
                  />
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
            </div>
          </BackgroundGradient>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 