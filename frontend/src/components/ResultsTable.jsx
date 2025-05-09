import React from 'react';

const ResultsTable = ({ results }) => {
  if (!results || results.length === 0) {
    return (
    <div className="w-full p-6 text-center bg-white bg-opacity-40 rounded-lg shadow-md">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  // Get all keys from results to use as columns (excluding some fields)
  const excludeFields = ['id', 'database', 'relevance'];
  const allKeys = Array.from(
    new Set(
      results.flatMap(result => 
        Object.keys(result).filter(key => !excludeFields.includes(key))
      )
    )
  );

  // Define database badge colors
  const getDatabaseBadgeClass = (database) => {
    const colorMap = {
      'postgres': 'bg-blue-100 text-blue-800',
      'postgresql': 'bg-blue-100 text-blue-800',
      'mongodb': 'bg-green-100 text-green-800',
      'mysql': 'bg-orange-100 text-orange-800',
      'elasticsearch': 'bg-purple-100 text-purple-800',
      'default': 'bg-gray-100 text-gray-800'
    };

    return colorMap[database.toLowerCase()] || colorMap.default;
  };

  return (
  <div className="w-full overflow-x-auto bg-white bg-opacity-40 rounded-lg shadow-lg">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Database</th>
            {allKeys.map(key => (
              <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-500 capitalize">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={result.id || index} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDatabaseBadgeClass(result.database)}`}>
                  {result.database}
                </span>
              </td>
              {allKeys.map(key => (
                <td key={`${result.id}-${key}`} className="px-4 py-3 text-sm text-gray-800">
                  {typeof result[key] === 'object' 
                    ? JSON.stringify(result[key]) 
                    : result[key] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;