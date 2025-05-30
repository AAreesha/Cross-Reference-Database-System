import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  // Fetch suggestions on component mount
  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/suggestions/');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');
    setSearchResults('');
    setShowSuggestions(false);

    try {
      const response = await fetch(`/api/semantic-search/?query=${encodeURIComponent(searchQuery)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Handle both cached and non-cached responses
        let gptResponse;
        if (result.cached && result.results) {
          // Cached response structure: {cached: true, results: {gpt_response: "..."}}
          gptResponse = result.results.gpt_response;
        } else {
          // Non-cached response structure: {cached: false, gpt_response: "..."}
          gptResponse = result.gpt_response;
        }
        
        setSearchResults(gptResponse || 'No results found');
        // Refresh suggestions after a successful search
        setTimeout(fetchSuggestions, 1000);
      } else {
        const error = await response.json();
        setError(error.detail || 'Search failed');
      }
    } catch (err) {
      setError('An error occurred during search');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults('');
    setError('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase()) &&
    suggestion.toLowerCase() !== searchQuery.toLowerCase()
  ).slice(0, 5);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Semantic Search</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Query your databases with natural language</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => navigate('/upload')}
                  className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="hidden xs:inline">Upload</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden xs:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 py-4 sm:py-6 lg:py-8 xl:py-12">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            {/* Search Form */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-white/20 mb-6 sm:mb-8">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Search Your Data</h2>
                  <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                    Ask questions in natural language about the data in your databases. The AI will search across all sources and provide intelligent answers.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6">
                  <div className="relative">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                      Enter your question
                    </label>
                    <div className="relative">
                      <textarea
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(e.target.value.length > 0 && filteredSuggestions.length > 0);
                        }}
                        onFocus={() => setShowSuggestions(searchQuery.length > 0 && filteredSuggestions.length > 0)}
                        onBlur={(e) => {
                          // Delay hiding suggestions to allow click events
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="Ask anything about contracts, vendors, agencies, deadlines, opportunities..."
                        rows="3"
                        className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none shadow-sm"
                        maxLength="500"
                      />
                      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-gray-400">
                        {searchQuery.length}/500
                      </div>
                    </div>
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-100 mb-1">
                            Recent searches
                          </div>
                          {filteredSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md sm:rounded-lg transition-colors duration-150 flex items-center"
                            >
                              <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="flex-1 truncate">{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={searching || !searchQuery.trim()}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 border border-transparent text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {searching ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm sm:text-base">Searching...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="text-sm sm:text-base">Search Databases</span>
                        </div>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Clear
                    </button>
                  </div>
                </form>

                {/* Database indicators */}
                <div className="mt-4 sm:mt-6 flex items-center justify-center">
                  <div className="flex items-center space-x-2 sm:space-x-4 bg-gray-50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2">
                    <span className="text-xs sm:text-sm text-gray-600">Searching across:</span>
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      {['DB1', 'DB2', 'DB3', 'DB4'].map((db, index) => (
                        <div key={db} className="flex items-center">
                          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-xs font-medium text-gray-600">{db}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Searches Section */}
            {suggestions.length > 0 && !searchResults && !searching && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-white/20 mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Searches</h3>
                    <span className="text-xs sm:text-sm text-gray-500">{suggestions.length} saved</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {suggestions.slice(0, 8).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md sm:rounded-lg text-xs sm:text-sm text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 group"
                      >
                        <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-2 text-blue-500 group-hover:text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="truncate max-w-xs">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {error && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-white/20 mb-6 sm:mb-8">
                <div className="p-4 sm:p-6">
                  <div className="rounded-lg sm:rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4">
                    <div className="flex">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2 sm:ml-3">
                        <h3 className="text-xs sm:text-sm font-medium text-red-800">Search Error</h3>
                        <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-white/20">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-0">Search Results</h3>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-500">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>AI-powered results</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100">
                    <div className="prose max-w-none">
                      <div className="text-gray-800 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words overflow-hidden">
                        {searchResults}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(searchResults)}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Results
                    </button>
                    <button
                      onClick={clearSearch}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      New Search
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Section - only show when no results and no recent searches */}
            {!searchResults && !searching && suggestions.length === 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-white/20">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Search Tips</h3>
                    <p className="text-sm sm:text-base text-gray-600">Here are some example queries to get you started</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      "Show me all contracts with deadlines this month",
                      "Which vendors have the most opportunities?", 
                      "Find small business set-aside contracts",
                      "What agencies are offering new contracts?"
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(example)}
                        className="text-left p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
                      >
                        <div className="flex items-start">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 sm:mr-3 mt-0.5 group-hover:text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 break-words">{example}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
                    <div className="flex">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2 sm:ml-3">
                        <h4 className="text-xs sm:text-sm font-medium text-amber-800">Pro Tips</h4>
                        <ul className="text-xs sm:text-sm text-amber-700 mt-1 space-y-0.5 sm:space-y-1">
                          <li>• Use natural language - ask as you would ask a person</li>
                          <li>• Be specific about what you're looking for</li>
                          <li className="hidden sm:list-item">• The AI searches across all connected databases</li>
                          <li className="sm:hidden">• AI searches all databases</li>
                          <li>• Results are based on the most relevant data found</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Search; 