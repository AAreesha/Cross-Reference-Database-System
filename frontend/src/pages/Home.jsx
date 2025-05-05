import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import ResultsTable from '../components/ResultsTable';
import { semanticSearch } from '../api';

const Home = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (query) => {
    setLoading(true);
    setShowResults(true);
    try {
      const response = await semanticSearch(query);
      setResults(response.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col items-center bg-gradient-to-r from-[#ffe7f0] via-[#faecf5] to-[#d1c4f9] p-8">
      {!showResults && (
        <h1 className="text-4xl md:text-5xl font-bold mb-10 bg-gradient-to-r from-[#24235b] to-purple-800 bg-clip-text text-transparent mt-20">
          One Search. Four Databases.
        </h1>
      )}

      <div className="w-full max-w-md mb-6">
      <SearchBar onSearch={handleSearch} />

        {showResults && <ResultsTable results={results} />}

      </div>

      {loading}

      {!loading && showResults && <ResultsTable data={results} />}
    </div>
  );
};

export default Home;
