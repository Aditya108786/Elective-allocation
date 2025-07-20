import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startvoiceRecognition } from '../Audioinput';
import { ChevronDown, ChevronUp, Upload, Trash, Settings, Mic } from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const fileinputref = useRef();

  const [file, setFile] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [seatlimit, setSeatlimit] = useState('');
  const [maxPref, setMaxPref] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const uploadCSV = async () => {
    if (!file) return setUploadMessage("❌ Please select a file first.");

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/upload-cgpa`, formData, { withCredentials: true });
      setUploadMessage('✅ CGPA CSV uploaded successfully.');
    } catch {
      setUploadMessage('❌ Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const allocate = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/allocate`, { withCredentials: true });
      setAllocations(res.data.allocation || []);
    } catch {
      setUploadMessage("❌ Allocation failed.");
    }
  };

  const addsubjects = async () => {
    if (!name || !seatlimit) return setUploadMessage("❌ Subject name and seat limit are required");

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/addsubjects`, { name, seatlimit }, { withCredentials: true });
      setUploadMessage("✅ Subject added successfully");
      setName('');
      setSeatlimit('');
    } catch (error) {
      setUploadMessage(error.response?.data?.message || '❌ Add subject failed');
    }
  };

  const maxPreferences = async () => {
    if (!maxPref || isNaN(maxPref) || Number(maxPref) <= 0) {
      return setUploadMessage("❌ Please enter a valid number for preferences");
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/max-pref`, {
        maxPreferences: Number(maxPref)
      }, { withCredentials: true });

      setUploadMessage("✅ Max preferences updated");
      setMaxPref('');
    } catch {
      setUploadMessage("❌ Setting max preferences failed");
    }
  };

  const getallstudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/getallstudents`, { withCredentials: true });
      setStudents(res.data || []);
    } catch {
      setUploadMessage("❌ Failed to fetch students");
    }
  };

  const deletestudent = async (rollNo) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE}/api/delete_student/${rollNo}`, { withCredentials: true });
      setStudents((prev) => prev.filter(s => s.rollNo !== rollNo));
      setUploadMessage("✅ Student deleted");
    } catch {
      setUploadMessage("❌ Deletion failed");
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/getAllsubjects`);
      setSubjects(res.data || []);
    } catch {
      setUploadMessage("❌ Failed to fetch subjects");
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const voicecommand = (transcript) => {
    if (transcript.includes("choose file")) fileinputref.current?.click();
    else if (transcript.includes("upload")) uploadCSV();
    else if (transcript.includes("allocate")) allocate();
    else if (transcript.includes("homepage")) navigate('/');
    else setUploadMessage("❌ Unrecognizable voice command.");
  };

  const startvoice = startvoiceRecognition(voicecommand);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
        >
          🏠 Home
        </button>

        <h2 className="text-4xl font-bold mb-6 text-center text-blue-700 dark:text-white tracking-wide">
          🛠 Admin Panel
        </h2>

        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <input
            type="file"
            ref={fileinputref}
            onChange={(e) => setFile(e.target.files[0])}
            className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          />
          <button onClick={uploadCSV} disabled={loading} className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
            <Upload size={18} /> Upload CGPA CSV
          </button>
          <button onClick={allocate} className="btn bg-blue-600 hover:bg-blue-700 text-white">⚙ Run Allocation</button>
          <button onClick={getallstudents} className="btn bg-yellow-500 hover:bg-yellow-600 text-white">👥 Show Students</button>
          <button onClick={startvoice} className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
            <Mic size={18} /> Voice Input
          </button>
        </div>

        {uploadMessage && (
          <div className="text-center mb-6 text-red-600 dark:text-red-400 font-medium">
            {uploadMessage}
          </div>
        )}

        {/* Configuration Section */}
        <div className="mb-10">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 text-lg font-bold text-white bg-blue-700 px-5 py-2 rounded-md mb-4"
          >
            <Settings size={20} /> Configuration {open ? <ChevronUp /> : <ChevronDown />}
          </button>

          {open && (
            <div className="grid md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-inner">
              {/* Add Subject */}
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-white mb-2">➕ Add Subject</h4>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Subject name"
                  className="input"
                />
                <input
                  type="number"
                  value={seatlimit}
                  onChange={(e) => setSeatlimit(e.target.value)}
                  placeholder="Seat limit"
                  className="input"
                />
                <button onClick={addsubjects} className="btn bg-purple-600 hover:bg-purple-700 text-white mt-2 w-full">
                  ➕ Add
                </button>
              </div>

              {/* Max Preferences Dropdown */}
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-white mb-2">🎯 Max Preferences</h4>
                <select
                  value={maxPref}
                  onChange={(e) => setMaxPref(e.target.value)}
                  className="input"
                >
                  <option value="">Select max preferences</option>
                  {subjects.map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <button onClick={maxPreferences} className="btn bg-orange-600 hover:bg-orange-700 text-white mt-2 w-full">
                  ✅ Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Allocation Results */}
        <SectionTable title="📋 Allocation Results" data={allocations} columns={['Roll No', 'Name', 'CGPA', 'Allocated']} keys={['rollNo', 'name', 'cgpa', 'allocated']} />

        {/* Students Table */}
        <SectionTable
          title="👥 Registered Students"
          data={students}
          columns={['Roll No', 'Name', 'CGPA', 'Action']}
          keys={['rollNo', 'name', 'cgpa']}
          action={(s) => (
            <button onClick={() => deletestudent(s.rollNo)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
              <Trash size={16} />
            </button>
          )}
        />
      </div>
    </div>
  );
};

const SectionTable = ({ title, data, columns, keys, action }) => (
  <div className="mb-10">
    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left border">
        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-2 border">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center p-4 text-gray-600 dark:text-white">No data found</td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="border-t">
                {keys.map((k, i) => (
                  <td key={i} className="px-4 py-2 text-gray-900 dark:text-white">{item[k]}</td>
                ))}
                {action && (
                  <td className="px-4 py-2">{action(item)}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Tailwind Utility Classes
const inputClass = "w-full px-4 py-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:text-white";
const buttonClass = "px-4 py-2 rounded-md font-semibold";

export default AdminPanel;
