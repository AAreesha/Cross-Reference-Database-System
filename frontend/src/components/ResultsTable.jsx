import PropTypes from 'prop-types';

// Table components
export function Table({ children, className }) {
  return (
    <table className={`w-full border-collapse text-xs text-[#343A40] ${className}`}>
      {children}
    </table>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="sticky top-0 shadow-sm z-0 font-bold text-purple-500">
      {children}
    </thead>
  );
}

export function TableBody({ children }) {
  return <tbody className="border">{children}</tbody>;
}

export function TableRow({ children, isHeader = false, className = "" }) {
    return (
      <tr
        className={`${
          isHeader
            ? "bg-purple-100 text-purple-900 text-sm"
            : "even:bg-purple-50 odd:bg-white"
        } border-b ${className}`}
      >
        {children}
      </tr>
    );
  }
  

export function TableCell({ children }) {
  return (
    <td className="pt-3 pb-3 pl-3 pr-4 border border-purple-300">
      {children}
    </td>
  );
}

// Prop types
ResultsTable.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableRow.propTypes = {
  children: PropTypes.node.isRequired,
  isHeader: PropTypes.bool,
  className: PropTypes.string,
};

TableCell.propTypes = {
  children: PropTypes.node.isRequired,
};

TableHeader.propTypes = {
  children: PropTypes.node.isRequired,
};

TableBody.propTypes = {
  children: PropTypes.node.isRequired,
};

// Combined sample component with table usage
export default function ResultsTable() {
  const results = [
    {
      db1_id: "ABC123",
      db2_id: "X001",
      db3_id: "7890",
      db4_id: "PQR999",
      score: 0.92,
      created_at: "2024-10-01 13:45:22",
    },
    {
      db1_id: "DEF456",
      db2_id: "X002",
      db3_id: "7891",
      db4_id: "PQR998",
      score: 0.89,
      created_at: "2024-10-02 09:31:47",
    },
    {
      db1_id: "GHI789",
      db2_id: "X003",
      db3_id: "7892",
      db4_id: "PQR997",
      score: 0.87,
      created_at: "2024-10-03 15:12:03",
    },
    {
      db1_id: "JKL321",
      db2_id: "X004",
      db3_id: "7893",
      db4_id: "PQR996",
      score: 0.85,
      created_at: "2024-10-04 11:22:10",
    },
    {
      db1_id: "MNO654",
      db2_id: "X005",
      db3_id: "7894",
      db4_id: "PQR995",
      score: 0.83,
      created_at: "2024-10-05 17:55:36",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow isHeader>
            <TableCell>Rank</TableCell>
            <TableCell>DB1 ID</TableCell>
            <TableCell>DB2 ID</TableCell>
            <TableCell>DB3 ID</TableCell>
            <TableCell>DB4 ID</TableCell>
            <TableCell>Relevance Score</TableCell>
            <TableCell>Created At</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{row.db1_id}</TableCell>
              <TableCell>{row.db2_id}</TableCell>
              <TableCell>{row.db3_id}</TableCell>
              <TableCell>{row.db4_id}</TableCell>
              <TableCell>{row.score.toFixed(2)}</TableCell>
              <TableCell>{row.created_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
