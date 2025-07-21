import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startvoiceRecognition } from '../Audioinput';
import { ChevronDown, ChevronUp, Upload, Trash, Settings, Mic } from 'lucide-react';
import SectionTable from './SectionnTable';

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

  const uploadpref = async()=>{
     if(!file){
     return  setUploadMessage("please select a file")
     }

     const formdata = new FormData(file)
     formdata.append('file', file)

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/admin_pref`, formdata, { withCredentials: true })
      setUploadMessage("file uploaded successfully")
    } catch (error) {
      setUploadMessage("upload failed")
    }
  }

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
  <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 relative">
    {/* Top Bar */}
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold text-blue-700 dark:text-white tracking-wide">🛠 Admin Panel</h2>
      <button
        onClick={() => navigate('/')}
        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition"
      >
        🏠 Home
      </button>
    </div>

    {/* Upload Section */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
      {/* CGPA Upload */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileinputref}
          onChange={(e) => setFile(e.target.files[0])}
          className="file-input"
        />
        <button
          onClick={uploadCSV}
          disabled={loading}
          className="btn-primary"
        >
          <Upload size={18} /> Upload CGPA
        </button>
      </div>

      {/* Preferences Upload */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileinputref}
          onChange={(e) => setFile(e.target.files[0])}
          className="file-input"
        />
        <button
          onClick={uploadpref}
          className="btn-primary"
        >
          <Upload size={18} /> Upload Preferences
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={allocate} className="btn-secondary">⚙ Run Allocation</button>
        <button onClick={getallstudents} className="btn-warning">👥 Show Students</button>
        <button onClick={startvoice} className="btn-voice"><Mic size={18} /> Voice Input</button>
      </div>
    </div>

    {/* Upload Message */}
    {uploadMessage && (
      <p className="text-center mb-6 text-red-600 dark:text-red-400 font-medium">{uploadMessage}</p>
    )}

    {/* Configuration */}
    <div className="mb-10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-lg font-bold text-white bg-blue-700 hover:bg-blue-800 px-5 py-2 rounded-md mb-4 transition"
      >
        <Settings size={20} /> Configuration {open ? <ChevronUp /> : <ChevronDown />}
      </button>

      {open && (
        <div className="grid md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
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
            <button onClick={addsubjects} className="btn-purple mt-2 w-full">➕ Add</button>
          </div>

          {/* Max Preferences */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-white mb-2">🎯 Max Preferences</h4>
            <select
              value={maxPref}
              onChange={(e) => setMaxPref(e.target.value)}
              className="input"
            >
              <option value="">Select max preferences</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <button onClick={maxPreferences} className="btn-orange mt-2 w-full">✅ Set</button>
          </div>
        </div>
      )}
    </div>

    {/* Tables */}
    <SectionTable title="📋 Allocation Results" data={allocations} columns={['Roll No', 'Name', 'CGPA', 'Allocated']} keys={['rollNo', 'name', 'cgpa', 'allocated']} />

    <SectionTable
      title="👥 Registered Students"
      data={students}
      columns={['Roll No', 'Name', 'CGPA', 'Action']}
      keys={['rollNo', 'name', 'cgpa']}
      action={(s) => (
        <button onClick={() => deletestudent(s.rollNo)} className="btn-danger">
          <Trash size={16} />
        </button>
      )}
    />
  </div>
</div>

);}

// Tailwind Utility Classes
const inputClass = "w-full px-4 py-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:text-white";
const buttonClass = "px-4 py-2 rounded-md font-semibold";

export default AdminPanel;
