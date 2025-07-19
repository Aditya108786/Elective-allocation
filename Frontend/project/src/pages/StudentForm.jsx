import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startvoiceRecognition } from '../Audioinput';

const StudentForm = () => {
  const [rollNo, setRollNo] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [maxPreferences, setMaxPreferences] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Fetch max preferences
  useEffect(() => {
    const fetchMaxPref = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/get-max-pref`);
        setMaxPreferences(res.data.maxPreferences);
        setPreferences(new Array(res.data.maxPreferences).fill(''));
      } catch (error) {
        setMessage('❌ Failed to fetch max preferences');
      }
    };
    fetchMaxPref();
  }, []);

  // Fetch all subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/getAllsubjects`);
        setSubjects(res.data);
      } catch (error) {
        setMessage('❌ Failed to fetch subjects');
      }
    };
    fetchSubjects();
  }, []);

  // Set roll number from session
  useEffect(() => {
    const storedRoll = sessionStorage.getItem("rollNo");
    if (!storedRoll) {
      navigate('/login');
    } else {
      setRollNo(storedRoll);
    }
  }, [navigate]);

  // Submit preferences
  const submitPreferences = async () => {
    const filtered = preferences.filter(p => p);
    const hasDuplicates = new Set(filtered).size !== filtered.length;

    if (hasDuplicates) {
      setMessage("❌ Preferences must be unique.");
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/preferences`, {
        rollNo,
        preferences,
      });
      setMessage('✅ Preferences submitted successfully!');
    } catch (err) {
      setMessage(err.response?.data?.error || '❌ Submission failed.');
    }
  };

  // Handle preference selection
  const handleChange = (index, value) => {
    const updated = [...preferences];
    updated[index] = value;
    setPreferences(updated);
  };

  // Navigation functions
  const homepage = () => navigate('/');
  const result = () => navigate('/result');

  // Voice commands
  const handleVoiceCommand = (transcript) => {
    const indexMap = {
      "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
      "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "to":2, "To":2
    };

    const pattern = /preference\s+(\w+)\s+(is|to)\s+(.*)/i;
    const match = transcript.match(pattern);

    if (match) {
      const index = indexMap[match[1].toLowerCase()] - 1;
      const value = match[3].trim();

      if (index >= 0 && index < preferences.length) {
        handleChange(index, value);
        setMessage(`✅ Preference ${index + 1} set to ${value}`);
      } else {
        setMessage("⚠ Invalid preference number.");
      }
    } else if (transcript.includes("submit")) {
      submitPreferences();
    } else if (transcript.includes("homepage")) {
      homepage();
    } else if (transcript.includes("result")) {
      result();
    } else {
      setMessage("⚠ Unrecognized voice command.");
    }
  };

  const startVoice = startvoiceRecognition(handleVoiceCommand);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <button
        onClick={homepage}
        className="absolute top-4 right-4 bg-gray-700 text-white px-4 py-2 rounded-md"
      >
        🏠 Home
      </button>

      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mt-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
          🎓 Student Preference Form
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Roll Number
          </label>
          <input
            type="text"
            value={rollNo}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>

        {preferences.map((pref, i) => (
          <div className="mb-4" key={i}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Preference {i + 1}
            </label>
            <select
              value={pref}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Subject</option>
              {subjects.map((subj) => (
                <option key={subj._id} value={subj.name}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          onClick={submitPreferences}
          disabled={preferences.some(p => p === '')}
          className={`w-full py-3 px-6 rounded-md text-white font-semibold text-lg mt-4 ${
            preferences.some(p => p === '')
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Submit Preferences
        </button>

        <button
          onClick={startVoice}
          className="w-full mt-4 text-white py-3 px-6 rounded-md text-lg font-semibold bg-purple-600 hover:bg-purple-700"
        >
          🎙 Start Voice Command
        </button>

        {message && (
          <p className="mt-4 text-center text-blue-600 dark:text-blue-400 text-sm font-medium">
            {message}
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={result}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            📋 View My Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
