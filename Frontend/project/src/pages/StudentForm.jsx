import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startvoiceRecognition } from '../Audioinput';

const StudentForm = () => {
  const [rollNo, setRollNo] = useState('');
  const [preferences, setPreferences] = useState(['', '', '', '']);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedroll = sessionStorage.getItem("rollNo");
    if (!storedroll) {
      navigate('/login');
    } else {
      setRollNo(storedroll);
    }
  }, [navigate]);

  const submitPreferences = async () => {
    const hasDuplicates =
      new Set(preferences.filter(p => p)).size !== preferences.filter(p => p).length;

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
      setPreferences(['', '', '', '']);
    } catch (err) {
      setMessage(err.response?.data?.error || '❌ Submission failed.');
    }
  };

  const handleChange = (index, value) => {
    const newPrefs = [...preferences];
    newPrefs[index] = value;
    setPreferences(newPrefs);
  };

  const homepage = () => navigate('/');
  const result = () => navigate('/result');

  const handleVoiceCommand = (transcript) => {
    const indexMap = {
      "one": 1, "two": 2, "three": 3, "four": 4,
      "1": 1, "2": 2, "3": 3, "4": 4, "to": 2
    };

    const pattern = /preference\s+(\w+)\s+(is|to)\s+(.*)/i;
    const match = transcript.match(pattern);

    if (match) {
      const indexWord = match[1].toLowerCase();
      const index = indexMap[indexWord] - 1;
      const value = match[3].trim().toUpperCase();

      if (index >= 0 && index < preferences.length) {
        handleChange(index, value);
        setMessage('✅' `Preference ${index + 1} set to ${value}`);
      } else {
        setMessage('⚠ Invalid preference number.');
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative px-6 py-8">
      <button
        onClick={homepage}
        className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md font-semibold z-10"
      >
        🏠 Home
      </button>

      <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 p-8 mt-10 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
          🎓 Student Preference Form
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Roll Number
          </label>
          <input
            type="text"
            value={rollNo}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
          />
        </div>

        {preferences.map((pref, i) => (
          <div className="mb-4" key={i}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Preference {i + 1}
            </label>
            <select
              value={pref}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Subject</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
              <option value="S4">S4</option>
            </select>
          </div>
        ))}

        <button
          onClick={submitPreferences}
          disabled={preferences.some(p => p === '')}
          className={`w-full text-white py-3 px-6 rounded-md text-lg font-semibold transition-all duration-200 ${
            preferences.some(p => p === '')
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Submit Preferences
        </button>

        <button
          onClick={startVoice}
          className="w-full mt-4 text-white py-3 px-6 rounded-md text-lg font-semibold bg-purple-600 hover:bg-purple-700 transition-all duration-200"
        >
          🎙 Start Voice Command
        </button>

        {message && (
          <p className="mt-4 text-center text-sm font-medium text-blue-600 dark:text-blue-400">
            {message}
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={result}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow"
          >
            📋 View My Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;