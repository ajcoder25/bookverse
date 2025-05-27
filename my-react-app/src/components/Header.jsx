import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bookService from '../api/bookService';

const Header = ({ onSearchResults, cartCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search results when search box is closed
  useEffect(() => {
    if (!isSearchOpen && onSearchResults && searchQuery.trim() === '') {
      onSearchResults(null);
    }
  }, [isSearchOpen, onSearchResults, searchQuery]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle search input change with debounce
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // If query is empty, clear suggestions
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }
    
    // Set a new timeout to fetch suggestions after user stops typing
    const timeout = setTimeout(() => {
      fetchSearchSuggestions(query);
    }, 300); // 300ms debounce
    
    setTypingTimeout(timeout);
  };
  
  // Fetch search suggestions as user types
  const fetchSearchSuggestions = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await bookService.quickSearch(query);
      
      if (results && results.items && results.items.length > 0) {
        // Format suggestions to show only title, author and thumbnail
        const suggestions = results.items.map(book => ({
          id: book.id,
          title: book.volumeInfo?.title || 'Untitled Book',
          author: book.volumeInfo?.authors?.join(', ') || 'Unknown Author',
          thumbnail: book.volumeInfo?.imageLinks?.smallThumbnail || 'https://via.placeholder.com/40x60.png?text=No+Cover'
        }));
        
        setSearchSuggestions(suggestions);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      console.log('Searching for:', searchQuery);
      // Make search case-insensitive by using the query as is
      const results = await bookService.searchBooks(searchQuery);
      console.log('Search results:', results);
      
      // Check if results exist and contain items
      if (results && results.items && results.items.length > 0) {
        onSearchResults(results.items);
        // Close the search box after successful search
        setIsSearchOpen(false);
        setSearchSuggestions([]);
        // Navigate to home page to show search results
        navigate('/');
      } else {
        // Handle no results case
        alert('No books found for your search. Please try a different query.');
      }
    } catch (error) {
      console.error('Error searching books:', error);
      alert('Error searching for books. Please try again.');
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion) => {
    try {
      // Get full book details for the selected suggestion
      const results = await bookService.searchBooks(`intitle:${suggestion.title}`);
      
      if (results && results.items && results.items.length > 0) {
        onSearchResults(results.items);
        setIsSearchOpen(false);
        setSearchSuggestions([]);
        // Set the search query to the selected book title
        setSearchQuery(suggestion.title);
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Clear search when opening the search box
      setSearchQuery('');
      setSearchSuggestions([]);
    }
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        {/* Mobile menu button */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b md:hidden">
            <nav className="px-4 py-2">
              <Link to="/" className="block py-2 px-4 text-sm hover:bg-gray-100 rounded-lg">Home</Link>
              <Link to="/" className="block py-2 px-4 text-sm hover:bg-gray-100 rounded-lg">Explore Books</Link>
              <Link to="/cart" className="block py-2 px-4 text-sm hover:bg-gray-100 rounded-lg">Cart</Link>
            </nav>
          </div>
        )}

        {/* Left side navigation - hidden on mobile */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/" className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100">
            Home
          </Link>
          <Link to="/" className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100">
            Explore Books
          </Link>
        </div>

        {/* Center logo */}
        <div className="flex items-center justify-center">
          <Link to="/" className="text-xl md:text-2xl font-bold tracking-wider">BookMart</Link>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search button and expandable search box */}
          <div className="relative flex items-center" ref={searchRef}>
            <form 
              onSubmit={handleSearch}
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-[200px] md:w-[300px] transition-all duration-300 ease-in-out ${
                isSearchOpen 
                  ? 'opacity-100 visible translate-x-0' 
                  : 'opacity-0 invisible translate-x-4'
              }`}
            >
              <input 
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search books..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
              />
              <button 
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                  setSearchSuggestions([]);
                  if (onSearchResults) {
                    onSearchResults(null);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              
              {/* Search suggestions dropdown */}
              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {searchSuggestions.map(suggestion => (
                    <div 
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <img 
                        src={suggestion.thumbnail} 
                        alt={suggestion.title}
                        className="w-10 h-14 object-cover mr-3"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40x60.png?text=No+Cover';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{suggestion.title}</p>
                        <p className="text-xs text-gray-500 truncate">{suggestion.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-gray-900 border-r-transparent"></div>
                  <span className="ml-2 text-sm text-gray-600">Searching...</span>
                </div>
              )}
            </form>
            
            <button 
              onClick={toggleSearch}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-opacity duration-300 ${
                isSearchOpen ? 'opacity-0' : 'opacity-100'
              }`}
              aria-label="Open search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Cart button */}
          <Link to="/cart" className="flex items-center space-x-1 md:space-x-2 p-2 md:px-4 md:py-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-5 md:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="hidden md:inline text-sm">Cart ({cartCount})</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center md:hidden">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;