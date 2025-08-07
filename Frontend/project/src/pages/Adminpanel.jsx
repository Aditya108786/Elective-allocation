import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom';
import { startvoiceRecognition } from '../Audioinput';
import { ChevronDown, ChevronUp, Upload, Trash, Settings, Mic } from 'lucide-react';
import SectionTable from './SectionnTable';
import SubjectTable from './SubjectTable';


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

  const uploadpref = async () => {
  if (!file) {
    return setUploadMessage("❌ Please select a file");
  }

  const reader = new FileReader();
  reader.onload = async (evt) => {
    const bstr = evt.target.result;
    const workbook = XLSX.read(bstr, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      alert('❌ The Excel file is empty.');
      return;
    }

    const hasPreferenceColumn = Object.keys(jsonData[0]).some((key) =>
      key.toLowerCase().includes('preference')
    );

    if (!hasPreferenceColumn) {
      alert('❌ No "preference" columns found in the Excel file.');
      return;
    }

    const formdata = new FormData();
    formdata.append('file', file);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/admin_pref`, formdata, {
        withCredentials: true,
      });
      setUploadMessage("✅ Preferences file uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadMessage("❌ Upload failed");
    }
  };

  reader.readAsBinaryString(file); // ← TRIGGER FILE READING
};

  const allocate = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/allocate`, { withCredentials: true });
      setAllocations(res.data.allocation || []);
      setUploadMessage("Allocated")
    } catch(error) {
      console.error("❌ Allocation failed - full error:\n", JSON.stringify(error, null, 2));

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

  const deleteSubject = async (id) => {
  try {
    await axios.delete(`${import.meta.env.VITE_API_BASE}/api/delete_subject/${id}`, { withCredentials: true });
    setSubjects((prev) => prev.filter((s) => s._id !== id));
    setUploadMessage("✅ Subject deleted");
  } catch {
    setUploadMessage("❌ Failed to delete subject");
  }
};

const deleteAll = async()=>{

   try {
      const res = await axios.delete(`${import.meta.env.VITE_API_BASE}/api/deleteall`, {withCredentials:true})
      setUploadMessage("All students deleted")
      setStudents([])
   } catch (error) {
     setUploadMessage("Failed to delete students")
   }
    
    
}

const configuration = ()=>{
   setOpen(!open)
}


  

  const voicecommand = (transcript) => {
  const lower = transcript.toLowerCase();

  if (lower.includes("choose file")) fileinputref.current?.click();
  else if (lower.startsWith("upload students")) uploadCSV();
  else if (lower.includes("allocate")) allocate();
  else if (lower.includes("homepage")) navigate('/');
  else if (lower.startsWith("upload preference")) uploadpref();
  else if (lower.includes("show all students")) getallstudents();
  else if (lower.includes("configuration")) configuration();
  else if (lower.startsWith("subject ")) {
    const subj = transcript.replace(/subject/i, "").trim();
    setName(subj);
  }
  else if (lower.includes("add")) addsubjects();
  else if (lower.includes("seat limit")) {
    const limit = transcript.replace(/seat limit/i, "").trim();
    setSeatlimit(limit);
  }
  else if (lower.includes("maximum preference")) {
    const pref = transcript.replace(/maximum preference/i, "").trim();
    setMaxPref(pref);
  }
  else if (lower.includes("set limit")) {
    maxPreferences();
  }
  else if (lower.includes("delete subject")) {
    const subjectToDelete = lower.replace("delete subject", "").trim();
    const matched = subjects.find((s) => s.name.toLowerCase() === subjectToDelete);
    if (matched) {
      deleteSubject(matched._id);
    } else {
      setUploadMessage(`❌ Subject "${subjectToDelete}" not found`);
    }
  }
  else if (lower.includes("delete student")) {
    const roll = lower.replace("delete student", "").trim();
    if (roll) {
      deletestudent(roll);
    } else {
      setUploadMessage(`❌ Invalid roll number`);
    }
  }
  else {
    setUploadMessage("❌ Unrecognizable voice command.");
  }
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
    {/* Upload Section */}
<div className="bg-white border rounded-xl p-6 shadow-sm mb-8">
  <h3 className="text-xl font-semibold text-gray-800 mb-1">Data Management & Actions</h3>
  <p className="text-sm text-gray-500 mb-4">Upload student data and run the allocation algorithm.</p>

  <div className="mb-4">
    <label className="block mb-1 font-medium text-gray-700">Student Data (CSV)</label>
    <input
      type="file"
      ref={fileinputref}
      onChange={(e) => setFile(e.target.files[0])}
      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                 file:rounded-md file:border-0 file:text-sm file:font-semibold
                 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
    />
  </div>

  <div className="flex flex-wrap gap-4">
    <button
      onClick={uploadCSV}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition"
    >
      <Upload size={16} /> Upload CGPA
    </button>

    <button
      onClick={uploadpref}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition"
    >
      <Upload size={16} /> Upload Prefs
    </button>

    <button
      onClick={allocate}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md transition"
    >
      ⚙ Run Allocation
    </button>

     <button
      onClick={getallstudents}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md transition"
    >
      show all students
    </button>

     

    <button
      onClick={startvoice}
      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-md transition"
    >
      <Mic size={16} /> Voice Input
    </button>
  </div>
</div>


    {/* Upload Message */}
    {uploadMessage && (
      <p className="text-center mb-6 text-red-600 dark:text-red-400 font-medium">{uploadMessage}</p>
    )}

    {/* Configuration Panel */}
<div className="mb-10">
  <button
    onClick={configuration}
    className="flex items-center justify-between gap-2 w-full text-lg font-semibold text-white bg-blue-700 hover:bg-blue-800 px-5 py-3 rounded-lg shadow-md transition-all"
  >
    <span className="flex items-center gap-2">
      <Settings size={20} /> Configuration
    </span>
    {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </button>

  {open && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-900 mt-6 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      
      {/* Add Subject */}
      <div className="flex flex-col gap-3">
        <h4 className="text-md font-bold text-gray-700 dark:text-white flex items-center gap-2">
          ➕ Add Subject
        </h4>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Subject Name"
          className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <input
          type="number"
          value={seatlimit}
          onChange={(e) => setSeatlimit(e.target.value)}
          placeholder="Seat Limit"
          className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <button
          onClick={addsubjects}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          ➕ Add Subject
        </button>
      </div>

      {/* Max Preferences */}
      <div className="flex flex-col gap-3">
        <h4 className="text-md font-bold text-gray-700 dark:text-white flex items-center gap-2">
          🎯 Max Preferences
        </h4>
        <select
          value={maxPref}
          onChange={(e) => setMaxPref(e.target.value)}
          className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="">Select max preferences</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <button
          onClick={maxPreferences}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          ✅ Set Preference Limit
        </button>
      </div>
    </div>
  )}
</div>

<SubjectTable subjects={subjects} deleteSubject={deleteSubject} />


    {/* Tables */}
    <SectionTable title="📋 Allocation Results" data={allocations} columns={['Roll No', 'Name', 'CGPA', 'Allocated']} keys={['rollNo', 'name', 'cgpa', 'allocated']} />


<button
      onClick={deleteAll}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md transition"
    >
      Delete All
    </button>

    <SectionTable
      title="👥 Registered Students"
      data={students}
      columns={['Roll No', 'Name', 'CGPA', 'Action']}
      keys={['rollNo', 'name', 'cgpa']}
      action={(s) => (
       <button
  onClick={() => deletestudent(s.rollNo)}
  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
  title="Delete Student"
>
  <Trash size={18} className="text-red-600" />
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
