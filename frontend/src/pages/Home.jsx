import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import ResultsTable from '../components/ResultsTable';
import Loader from '../components/Loader'; // Make sure this matches your actual spinner component name
import { semanticSearch } from '../api';
import ErrorModal from '../components/ErrorModal';

const defaultResults = [
  { id: 1, title: 'Top Contractors by NAICS Code', database: 'PostgreSQL', relevance: 'High' },
  { id: 2, title: 'Upcoming Expiring Contracts – DoD', database: 'MongoDB', relevance: 'High' },
  { id: 3, title: 'Subcontractor Network Map – Raytheon', database: 'Elasticsearch', relevance: 'Medium' },
  { id: 4, title: 'Award Growth Trends – Small Business Set-Asides', database: 'MySQL', relevance: 'High' },
  { id: 5, title: 'Firms Approaching 8(a) Graduation', database: 'PostgreSQL', relevance: 'Medium' },
];


const Home = () => {
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorType, setErrorType] = useState('generic');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

const handleSearch = async (query) => {
  setLoading(true);
  setShowResults(false);

  try {
    const response = await semanticSearch(query);

    // Use the response directly, whether cached or not
    const formatted = [
      {
        id: 1,
        title: response.gpt_response || 'No response generated.',
        sources: response.sources || [],
        cached: response.cached || false
      },
    ];

    setResults(formatted);
  } catch (error) {
    console.error('Semantic search failed:', error);

    if (error.code === 'ERR_NETWORK') {
      setErrorType('network');
    } else if (error.message?.includes("quota")) {
      setErrorType("openaiQuota");
    } else if (error.message?.includes("embedding")) {
      setErrorType("embeddings");
    } else {
      setErrorType("generic");
    }

    setErrorOpen(true);
    setResults([]);
  }

  setLoading(false);
  setShowResults(true);
};



  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center bg-gradient-to-r from-[#ffe7f0] via-[#faecf5] to-[#d1c4f9] p-8  overflow-x-hidden">
      {/* Background shape pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-30 z-0"></div>

      {/* Main content container */}
      <div className="container mx-auto px-4 py-16 z-10 max-w-5xl flex-1 flex flex-col">
        <div className={`transition-all duration-300 ease-in-out ${showResults ? 'mt-50' : 'pt-20'}`}>
          <div className="text-center mb-8">
            <h1 className={`transition-all duration-300 ease-in-out ${showResults ? 'text-3xl md:text-4xl' : 'text-5xl md:text-5xl'} font-extrabold mb-4`}>
              <span className="bg-gradient-to-r from-[#3b3a81] via-purple-700 to-pink-600 bg-clip-text text-transparent">
                One Search. Four Databases.
              </span>
            </h1>
            {!showResults && (
              <p className="text-md text-gray-400 max-w-2xl mx-auto pb-3">
                Search across 4 databases with a single query.
              </p>
            )}
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-8 mt-2">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="mt-10 flex justify-center">
              <Loader />
            </div>
          )}

          {/* Results Table */}
          {showResults && !loading && results.length > 0 && (
            <div className="mt-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                {/* <h2 className="text-md text-gray-500">Respons</h2> */}
                {/* <span className="text-sm text-gray-500">Top {results.length} Results</span> */}
              </div>
              <ResultsTable results={results} />
            </div>
          )}
        </div>
      </div>
      <ErrorModal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        errorType={errorType}
      />


      {/* Footer */}
      <footer className="w-full py-4 mt-auto z-10 text-center text-sm text-gray-500">
        © 2025 Cross Reference Database
      </footer>
    </div>
  );
};

export default Home;
