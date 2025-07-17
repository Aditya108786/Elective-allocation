import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startvoiceRecognition } from '../Audioinput';

const AdminPanel = () => {
  const navigate = useNavigate();
  const fileinputref = useRef();
  const [file, setFile] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const uploadCSV = async () => {
    if (!file) {
      setUploadMessage("❌ Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/upload-cgpa`, formData, {
        withCredentials: true,
      });
      setUploadMessage('✅ CGPA CSV uploaded successfully.');
    } catch {
      setUploadMessage('❌ Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const allocate = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/allocate`, {
        withCredentials: true,
      });
      setAllocations(res.data.allocation || []);
    } catch {
      setUploadMessage("❌ Allocation failed.");
    }
  };

  const voicecommand = (transcript) => {
    if (transcript.includes("choose file")) {
      fileinputref.current?.click();
    } else if (transcript.includes("upload")) {
      uploadCSV();
    } else if (transcript.includes("allocate")) {
      allocate();
    } else if (transcript.includes("homepage")) {
      navigate('/');
    } else {
      setUploadMessage("❌ Unrecognizable voice command.");
    }
  };

  const startvoice = startvoiceRecognition(voicecommand);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md font-semibold"
        >
          🏠 Home
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-white">
          🛠 Admin Panel
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <input
            type="file"
            ref={fileinputref}
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full md:w-auto px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800"
          />
          <button
            onClick={uploadCSV}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold"
          >
            📤 Upload CGPA CSV
          </button>
          <button
            onClick={allocate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold"
          >
            ⚙ Run Allocation
          </button>
          <button
            onClick={startvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold"
          >
            🎙 Voice Input
          </button>
        </div>

        {uploadMessage && (
          <div className="text-center text-sm font-medium mb-4 text-red-600 dark:text-red-400">
            {uploadMessage}
          </div>
        )}

        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          📋 Allocation Results
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-300 dark:border-gray-600">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 border-r">Roll No</th>
                <th className="px-4 py-2 border-r">Name</th>
                <th className="px-4 py-2 border-r">CGPA</th>
                <th className="px-4 py-2">Allocated</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500 dark:text-gray-400">
                    No allocation results yet.
                  </td>
                </tr>
              ) : (
                allocations.map((s) => (
                  <tr
                    key={s.rollNo}
                    className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600"
                  >
                    <td className="px-4 py-2 border-r text-green-600 font-semibold">{s.rollNo}</td>
                    <td className="px-4 py-2 border-r text-green-600 font-semibold">{s.name}</td>
                    <td className="px-4 py-2 border-r text-green-600 font-semibold">{s.cgpa}</td>
                    <td className="px-4 py-2 text-green-600 font-semibold">
                      {s.allocated || 'Not Allocated'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;