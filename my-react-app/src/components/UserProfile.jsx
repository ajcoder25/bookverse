import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';
import Footer from './Footer';
import bookService from '../services/bookService';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    defaultAddress: ''
  });
  const [orders, setOrders] = useState([]);
  const [bookDetailsCache, setBookDetailsCache] = useState({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Load profile from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    // Fetch orders from backend
    async function fetchOrders() {
      setOrdersLoading(true);
      try {
        const { orderService } = await import('../services/orderService');
        const backendOrders = await orderService.getMyOrders();
        setOrders(backendOrders || []);
        setOrdersLoading(false);
        // Fetch book details for all order items
        const bookIds = new Set();
        (backendOrders || []).forEach(order => {
          (order.items || []).forEach(item => {
            // item.book can be id or object
            if (typeof item.book === 'string' || typeof item.book === 'number') {
              bookIds.add(item.book);
            } else if (item.book && (item.book._id || item.book.id)) {
              bookIds.add(item.book._id || item.book.id);
            }
          });
        });
        const cache = {};
        await Promise.all(Array.from(bookIds).map(async id => {
          try {
            const book = await bookService.getBookById(id);
            cache[id] = book;
          } catch (e) {
            cache[id] = null;
          }
        }));
        setBookDetailsCache(cache);
      } catch (err) {
        setOrders([]);
        setOrdersLoading(false);
        console.error('Failed to fetch orders:', err);
      }
    }
    fetchOrders();
  }, []);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Save updated profile to localStorage
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setIsEditing(false);
    setNotification({
      type: 'success',
      message: 'Profile updated successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 container mx-auto px-4 py-8">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="md:w-1/4">
          <BackgroundGradient className="bg-white rounded-xl p-6">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'profile'
                    ? 'bg-black text-white'
                    : 'text-gray-700'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'orders'
                    ? 'bg-black text-white'
                    : 'text-gray-700'
                }`}
              >
                Order History
              </button>
            </nav>
          </BackgroundGradient>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4">
          <BackgroundGradient className="bg-white rounded-xl p-6">
            {activeTab === 'profile' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Profile Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.name || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.email || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.phone || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Delivery Address
                      </label>
                      {isEditing ? (
                        <textarea
                          name="defaultAddress"
                          value={profile.defaultAddress}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.defaultAddress || 'Not set'}</p>
                      )}
                    </div>

                    {isEditing && (
                      <button
                        type="submit"
                        className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Save Changes
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">Order History</h2>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <span className="text-gray-500">Loading your orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                    <Link
                      to="/explore"
                      className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order._id || order.id}
                        className="bg-white shadow-xl rounded-2xl p-6 mb-4 border border-gray-200"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6 border-b pb-3">
                          <div>
                            <span className="block text-lg font-bold text-gray-900">
                              Order #{order._id?.slice(-6) || order.id}
                            </span>
                            <span className="text-sm text-gray-500">
                              Placed on {formatDate(order.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            {(() => {
                              // Friendly status label mapping
                              const statusMap = {
                                pending: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
                                completed: { label: 'Delivered', color: 'bg-green-100 text-green-800 border border-green-300' },
                                shipped: { label: 'Shipped', color: 'bg-blue-100 text-blue-800 border border-blue-300' },
                                cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border border-red-300' },
                              };
                              const status = order.status || 'pending';
                              const { label, color } = statusMap[status] || { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-gray-100 text-gray-800 border border-gray-300' };
                              return (
                                <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm ${color}`}>
                                  {label}
                                </span>
                              );
                            })()} 
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-gray-100">
                          {order.items?.map((item, idx) => {
  let bookId = null;
  if (typeof item.book === 'string' || typeof item.book === 'number') bookId = item.book;
  else if (item.book && (item.book._id || item.book.id)) bookId = item.book._id || item.book.id;
  const bookData = bookId && bookDetailsCache[bookId] ? bookDetailsCache[bookId] : (typeof item.book === 'object' ? item.book : {});
  return (
    <div key={item._id || item.id || idx} className="flex items-center py-4 gap-4">
      <img
        src={bookData.image || bookData.imageLinks?.thumbnail || 'https://via.placeholder.com/64x80.png?text=No+Cover'}
        alt={bookData.title || 'Book'}
        className="w-16 h-20 object-cover rounded-lg border border-gray-200 bg-gray-50"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://via.placeholder.com/64x80.png?text=No+Cover';
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {bookData.title || 'Unknown Title'}
        </p>
        <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-600">
          <span>Quantity: <span className="font-medium text-gray-800">{item.quantity}</span></span>
          <span>Price: <span className="font-medium text-gray-800">₹{item.price}</span></span>
        </div>
      </div>
    </div>
  );
})}

                        </div>

                        {/* Address & Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Delivery Address</h4>
                            <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
                              {order.address?.streetAddress}<br />
                              {order.address?.city}, {order.address?.state} - {order.address?.postalCode}<br />
                              {order.address?.country}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Payment Method</h4>
                            <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
                              {order.paymentMethod || 'Cash on Delivery'}
                            </div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-end mt-6">
                          <div className="text-right">
                            <span className="block text-xs text-gray-500">Total Amount</span>
                            <span className="text-xl font-bold text-blue-700">₹{Number(order.totalAmount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </BackgroundGradient>
        </div>
      </div>
      </div>
     
    </div>
  );
};

export default UserProfile;
