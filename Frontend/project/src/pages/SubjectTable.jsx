
import React from 'react';
import { Trash } from 'lucide-react';

const SubjectTable = ({ subjects, deleteSubject }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full md:w-96 max-h-[500px] overflow-y-auto border">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Available Subjects</h3>
      <table className="min-w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Seats</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject, index) => (
            <tr key={index} className="border-b">
              <td className="px-4 py-2">{subject.name}</td>
              <td className="px-4 py-2">{subject.seatlimit}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => deleteSubject(subject._id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                  title="Delete Subject"
                >
                  <Trash size={18} className="text-red-600" />
                </button>
              </td>
            </tr>
          ))}
          {subjects.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-gray-400 py-4">No subjects added yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectTable;
