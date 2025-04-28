import React, { useState } from 'react';
import { Search, Play } from 'lucide-react';
import { ClipLoader } from 'react-spinners';

const DEFAULT_RESULTS = [
  'Result One',
  'Result Two',
  'Result Three',
  'Result Four',
  'Result Five',
];

// Suggestions for autocomplete
const SUGGESTIONS = [
  'Tell me more about the theory of evolution',
  'What is the theory of relativity',
  'Explain Darwin’s theory',
];

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [showLocalResults, setShowLocalResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleGo = () => {
    setShowLocalResults(true);
    setIsLoading(true);
    setShowSuggestions(false);
    onSearch();

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full overflow-visible flex flex-col items-center">
      <div
        className={`relative transition-all duration-500 ease-out
          ${showLocalResults ? 'transform -translate-y-56 w-[calc(100%+4rem)]' : 'w-full'}`}
      >
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search..."
          className="w-full py-3 pl-12 pr-16 rounded-full shadow-lg
                     text-gray-700 placeholder-gray-400
                     focus:outline-none focus:ring-0 focus:border-transparent"
        />

        {/* Left search icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>

        {/* Right “Go” button */}
        <button
          onClick={handleGo}
          className="absolute right-2 top-1/2 transform -translate-y-1/2
                     bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-full
                     text-white shadow-md hover:scale-105 transition
                     focus:outline-none focus:ring-0 focus:border-transparent"
        >
          <Play size={14} />
        </button>

        {/* Autocomplete Suggestions */}
        {showSuggestions && (
          <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-20">
            {SUGGESTIONS.filter(s =>
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

      {/* RESULTS PANEL */}
      {showLocalResults && (
        <div className="absolute top-[calc(100%-11rem)] mt-2 -left-50 w-[calc(100%+10rem)] bg-white rounded-lg shadow-lg p-4 z-10
                        flex flex-col items-center justify-start
                        max-h-[500px] overflow-y-auto">
          {/* Show loader if loading */}
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <ClipLoader
                color="#8b5cf6"
                size={50}
                cssOverride={{
                  borderWidth: '5px',
                }}
              />
            </div>
          ) : (
            <ul className="space-y-2 w-full">
              {DEFAULT_RESULTS.map((item, idx) => (
                <li key={idx} className="px-4 py-2 rounded cursor-pointer w-full">
                  <div className="bg-gray-100 p-3 rounded shadow-sm">{item}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
