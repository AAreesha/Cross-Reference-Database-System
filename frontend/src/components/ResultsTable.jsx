import React from 'react';
import ReactMarkdown from 'react-markdown';

const ResultsTable = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <div className="w-full p-6 text-center bg-white bg-opacity-40 rounded-lg shadow-md">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  const getSourceBadgeClass = (source) => {
    const colorMap = {
      db1: 'bg-blue-100 text-blue-800',
      db2: 'bg-green-100 text-green-800',
      db3: 'bg-yellow-100 text-yellow-800',
      db4: 'bg-purple-100 text-purple-800',
    };
    return colorMap[source.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-full space-y-4">
      {results.map((result, index) => (
        <div
          key={result.id || index}
          className="w-full bg-white bg-opacity-40 rounded-lg shadow-md p-6"
        >
          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            <ReactMarkdown>{result.title}</ReactMarkdown>
          </div>

          {result.cached && (
            <span className="inline-block text-xs mt-3 px-2 py-0.5 bg-yellow-100 text-yellow-700 font-medium rounded-full">
              ⚡ Cached
            </span>
          )}

          {result.sources && (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.sources.map((src, i) => (
                <span
                  key={i}
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSourceBadgeClass(src)}`}
                >
                  {src}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultsTable;
