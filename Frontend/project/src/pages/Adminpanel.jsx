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

  const [name, setName] = useState('');
  const [seatlimit, setSeatlimit] = useState('');
  const [maxPref, setMaxPref] = useState('');
  const [students, setStudents] = useState([]);

  const uploadCSV = async () => {
    if (!file) return setUploadMessage("❌ Please select a file first.");

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

  const addsubjects = async () => {
    if (!name || !seatlimit) {
      setUploadMessage("❌ Subject name and seat limit are required");
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/addsubjects`, {
        name,
        seatlimit,
      }, {
        withCredentials: true,
      });
      setUploadMessage("✅ Subject added successfully");
      setName('');
      setSeatlimit('');
    } catch (error) {
      setUploadMessage(error.response?.data?.message || '❌ Add subject failed');
    }
  };

  const maxPreferences = async () => {
  if (!maxPref || isNaN(maxPref) || Number(maxPref) <= 0) {
    return setUploadMessage("❌ Please enter a valid positive number for max preferences");
  }

  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE}/api/max-pref`,
      {
        maxPreferences: Number(maxPref),
      },
      {
        withCredentials: true,
      }
    );

    setUploadMessage("✅ Max preferences updated");
    setMaxPref('');
  } catch (error) {
    console.error("Error updating max preferences:", error);
    setUploadMessage("❌ Setting max preferences failed");
  }
};


  const getallstudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/getallstudents`, {
        withCredentials: true,
      });
      setStudents(res.data.students || []);
    } catch {
      setUploadMessage("❌ Failed to fetch students");
    }
  };

  const deletestudent = async (rollNo) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE}/api/delete_student/${rollNo}`, {
        withCredentials: true,
      });
      setStudents((prev) => prev.filter(s => s.rollNo !== rollNo));
      setUploadMessage("✅ Student deleted");
    } catch {
      setUploadMessage("❌ Deletion failed");
    }
  };

  const voicecommand = (transcript) => {
    if (transcript.includes("choose file")) fileinputref.current?.click();
    else if (transcript.includes("upload")) uploadCSV();
    else if (transcript.includes("allocate")) allocate();
    else if (transcript.includes("homepage")) navigate('/');
    else setUploadMessage("❌ Unrecognizable voice command.");
  };

  const startvoice = startvoiceRecognition(voicecommand);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md font-semibold"
        >
          🏠 Home
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-white">
          🛠 Admin Panel
        </h2>

        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="file"
            ref={fileinputref}
            onChange={(e) => setFile(e.target.files[0])}
            className="px-4 py-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white"
          />
          <button onClick={uploadCSV} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
            📤 Upload CGPA CSV
          </button>
          <button onClick={allocate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            ⚙ Run Allocation
          </button>
          <button onClick={getallstudents} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md">
            👥 Show All Students
          </button>
          <button onClick={startvoice} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
            🎙 Voice Input
          </button>
        </div>

        {uploadMessage && (
          <div className="text-center mb-4 text-red-600 dark:text-red-400 font-medium">
            {uploadMessage}
          </div>
        )}

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">⚙ Configuration</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">➕ Add Subject</h4>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Subject name"
                className="w-full px-4 py-2 mb-2 border rounded"
              />
              <input
                type="number"
                value={seatlimit}
                onChange={(e) => setSeatlimit(e.target.value)}
                placeholder="Seat limit"
                className="w-full px-4 py-2 mb-2 border rounded"
              />
              <button onClick={addsubjects} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md">
                ➕ Add
              </button>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">🎯 Max Preferences</h4>
              <input
                type="number"
                value={maxPref}
                onChange={(e) => setMaxPref(e.target.value)}
                placeholder="Enter max preferences"
                className="w-full px-4 py-2 mb-2 border rounded"
              />
              <button onClick={maxPreferences} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md">
                ✅ Set Max Preferences
              </button>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          📋 Allocation Results
        </h3>
        <div className="overflow-x-auto mb-10">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 border">Roll No</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">CGPA</th>
                <th className="px-4 py-2 border">Allocated</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500 dark:text-gray-400">No allocation results yet.</td>
                </tr>
              ) : (
                allocations.map((s) => (
                  <tr key={s.rollNo} className="border-t">
                    <td className="px-4 py-2">{s.rollNo}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.cgpa}</td>
                    <td className="px-4 py-2">{s.allocated || 'Not Allocated'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          👥 Registered Students
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 border">Roll No</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">CGPA</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">No students found</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.rollNo} className="border-t">
                    <td className="px-4 py-2">{s.rollNo}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.cgpa}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deletestudent(s.rollNo)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        🗑 Delete
                      </button>
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

export default AdminPanel;
