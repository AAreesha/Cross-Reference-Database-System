// Updated ResultsTable.jsx (Dynamic version with props)
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
Table.propTypes = {
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

// Final dynamic ResultsTable
export default function ResultsTable({ results }) {
  if (!results || results.length === 0) {
    return <p className="text-gray-600"></p>;
  }

  return (
    <div className="overflow-x-auto my-10">
      <Table>
        <TableHeader>
          <TableRow isHeader>
            <TableCell>Rank</TableCell>
            <TableCell>DB1 ID</TableCell>
            <TableCell>DB2 ID</TableCell>
            <TableCell>DB3 ID</TableCell>
            <TableCell>DB4 ID</TableCell>
            <TableCell>Created At</TableCell>
            {/* <TableCell>Embedding</TableCell> New column */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{row.db1_id || '-'}</TableCell>
              <TableCell>{row.db2_id || '-'}</TableCell>
              <TableCell>{row.db3_id || '-'}</TableCell>
              <TableCell>{row.db4_id || '-'}</TableCell>
              {/* <TableCell>
            <div className="max-w-xs overflow-x-auto whitespace-nowrap text-xs">
              {row.embedding?.slice(0, 5).map((val, idx) => (
                <span key={idx}>{val.toFixed(3)} </span>
              ))}
              {row.embedding?.length > 5 && '...'}
            </div>
          </TableCell> */}

                  

              <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

ResultsTable.propTypes = {
  results: PropTypes.arrayOf(PropTypes.object).isRequired,
};
