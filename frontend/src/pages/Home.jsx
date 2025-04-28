import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

const Home = () => {
  const [showResults, setShowResults] = useState(false);

  return (
    <div
      className="w-screen min-h-screen flex flex-col items-center justify-center
                 bg-gradient-to-r from-[#ffe7f0] via-[#faecf5] to-[#d1c4f9] p-8"
    >
      {!showResults && (
        <h1
          className="text-4xl md:text-5xl font-bold mb-10
                     bg-gradient-to-r from-[#24235b] to-purple-800
                     bg-clip-text text-transparent"
        >
          One Search. Four Databases.
        </h1>
      )}

      <div className="w-full max-w-md">
        <SearchBar onSearch={() => setShowResults(true)} />
      </div>
    </div>
  );
};

export default Home;
