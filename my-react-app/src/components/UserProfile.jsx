import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackgroundGradient } from './ui/background-gradient';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    defaultAddress: ''
  });
  const [orders, setOrders] = useState([]);
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
      try {
        const { orderService } = await import('../services/orderService');
        const backendOrders = await orderService.getMyOrders();
        setOrders(backendOrders || []);
      } catch (err) {
        setOrders([]);
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
    <div className="container mx-auto px-4 py-8">
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
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'orders'
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
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
                {orders.length === 0 ? (
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
                        className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold">Order #{order._id?.slice(-6) || order.id}</p>
                            <p className="text-sm text-gray-600">
                              Placed on {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {order.items?.map((item, idx) => (
                            <div key={item._id || item.id || idx} className="flex items-center gap-4">
                              <img
                                src={item.image || item.book?.imageLinks?.thumbnail || item.book?.image || 'https://via.placeholder.com/64x80.png?text=No+Cover'}
                                alt={item.title || item.book?.title || 'Book'}
                                className="w-16 h-20 object-cover rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/64x80.png?text=No+Cover';
                                }}
                              />
                              <div>
                                <p className="font-medium">{item.title || item.book?.title || 'Unknown Title'}</p>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity}
                                </p>
                                <p className="text-sm font-medium">₹{item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between">
                            <span className="font-medium">Total Amount:</span>
                            <span className="font-bold">₹{order.totalAmount}</span>
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
  );
};

export default UserProfile;
