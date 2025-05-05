import React, { useState } from 'react';
import { Search, Play } from 'lucide-react';
import { ClipLoader } from 'react-spinners';

const SUGGESTIONS = [
  'Defense contracts in Ohio',
  'Vendors registered for HVAC',
  'Brake assembly procurement',
];

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleGo = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setShowSuggestions(false);
    await onSearch(query); // trigger parent's semanticSearch
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleGo();
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
            {SUGGESTIONS.filter((s) =>
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

      {isLoading && (
        <div className="mt-4 flex justify-center items-center h-12">
          <ClipLoader color="#8b5cf6" size={32} />
        </div>
      )}
    </div>
  );
};

export default SearchBar;
