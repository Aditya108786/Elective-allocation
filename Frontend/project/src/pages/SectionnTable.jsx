
import React from 'react';
import { AlertCircle } from 'lucide-react';

const SectionTable = ({ title, data, columns, keys, action }) => {
  return (
    <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow overflow-x-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} record{data.length !== 1 ? 's' : ''} found
        </p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="text-left px-4 py-2 border-b">{col}</th>
            ))}
            
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (action ? 1 : 0)} className="text-center py-8 text-gray-400">
                <svg className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 4a8 8 0 110 16 8 8 0 010-16z" />
                </svg>
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {keys.map((k, i) => (
                  <td key={i} className="px-4 py-2 border-b text-gray-800 dark:text-gray-200">{item[k] || '-'}</td>
                ))}
                {action && (
                  <td className="px-4 py-2 border-b">
                    {action(item)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
 export default SectionTable