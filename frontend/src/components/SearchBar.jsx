import React, { useState } from 'react';
import { Search, Play } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import ResultsTable from './ResultsTable';
import Loader from './Loader';
const DEFAULT_RESULTS = [
  'Result One',
  'Result Two',
  'Result Three',
  'Result Four',
  'Result Five',
];

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
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full flex flex-col items-center px-4 sm:px-0">
      <div
        className={`relative transition-all duration-500 ease-out w-full max-w-[90vw] sm:max-w-xl
          ${showLocalResults ? 'transform -translate-y-56 sm:-translate-y-56' : ''}`}
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

        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>

        <button
          onClick={handleGo}
          className="absolute right-2 top-1/2 transform -translate-y-1/2
                     bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-full
                     text-white shadow-md hover:scale-105 transition
                     focus:outline-none focus:ring-0 focus:border-transparent"
        >
          <Play size={14} />
        </button>

        {showSuggestions && (
          <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto">
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
{/* 
      {showLocalResults && (
        <div className="absolute top-[calc(100%-11rem)] sm:top-[calc(100%-11rem)] mt-2 w-[90vw] sm:w-[calc(100%+10rem)] bg-white rounded-lg shadow-lg p-4 z-10
                        flex flex-col items-center justify-start max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <ClipLoader
                color="#8b5cf6"
                size={50}
                cssOverride={{ borderWidth: '5px' }}
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
      )} */}
      {showLocalResults && (
        <div className="absolute top-[calc(100%-11rem)] sm:top-[calc(100%-11rem)] mt-2 w-[100vw] sm:w-[calc(100%+10rem)] bg-white rounded-lg shadow-lg p-4 
         flex flex-col items-center justify-start max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <ClipLoader
              color="#8b5cf6"
              size={50}
              cssOverride={{ borderWidth: '5px' }}
            />
          
          </div>
        ) : (
         <ResultsTable/>
        )}
      </div>
    )}

    </div>
  );
};

export default SearchBar;
