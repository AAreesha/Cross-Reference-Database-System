import React, { useState, useEffect } from 'react';
import { Search, Play } from 'lucide-react';
import { getSuggestions } from '../api'; 




const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleGo = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setShowSuggestions(false);
    await onSearch(query); // trigger parent's semanticSearch
    setIsLoading(false);
  };

  // 🔁 Fetch suggestions every time the query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) return;

      try {
        const data = await getSuggestions(); // Fetch suggestions from Redis
        const filtered = data.filter((item) =>
          item.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    };

    fetchSuggestions();
  }, [query]);


  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Directly trigger the search with the full suggestion:
    onSearch(suggestion);
  };


  return (
    <div className="relative w-full flex flex-col items-center px-4 sm:px-0">
      <div className="relative transition-all duration-500 ease-out w-full max-w-[90vw] sm:max-w-xl">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search contracts, vendors, NAICS..."
          className="w-full py-3 pl-12 pr-16 rounded-full shadow-lg text-gray-700 placeholder-gray-400 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleGo()}
        />

        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none">
          <Search size={20} />
        </div>

        <button
          onClick={handleGo}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-full text-white shadow-md hover:scale-105 transition focus:outline-none"
        >
          <Play size={14} />
        </button>

        {showSuggestions && (
          <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto">
            {suggestions.filter((s) =>
              s.toLowerCase().includes(query.toLowerCase())
            ).map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 text-sm"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

     
    </div>
  );
};

export default SearchBar;