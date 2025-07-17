import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../AdminAuthContext";
import { startvoiceRecognition } from "../Audioinput";

const Adminlogin = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [username, setadminName] = useState('');
  const [password, setpassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('')

  const handlelogin = async () => {
    if (!username || !password) {
      setUploadMessage("username and password required")
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/admin_login`, {
        username,
        password,
      }, { withCredentials: true });

      login();
      navigate('/Admin');
    } catch (error) {
      setUploadMessage(error.response?.data?.message || 'Login failed');

    } finally {
      setLoading(false);
    }
  };

  const keyword = ["name", "admin", "username"];

  const voicecommand = (transcript) => {
    const matched = keyword.find(word => transcript.includes(word));
    if (matched) {
      let value = transcript.replace(matched, "").trim();
      value = value.charAt(0).toUpperCase() + value.slice(1);

      setadminName(value);
    } else if (transcript.includes("password")) {
      const pass = transcript.replace("password", "").trim();
      setpassword(pass);
    } else if (transcript.includes("login")) {
      handlelogin();
    } else if (transcript.includes("home")) {
      navigate('/');
    }
    // else do nothing (silent fail for unrecognized voice)
  };

  const startvoice = startvoiceRecognition(voicecommand);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="bg-gray-100 hover:bg-gray-800 text-center mb-6 text-white px-4 py-2 rounded-md font-semibold"
        >
          🏠 Home
        </button>

        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          🔐 Admin Login
        </h2>

        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Username
          </label>
          <input
            type="text"
            id="username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setadminName(e.target.value)}
            className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setpassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        <button
          onClick={handlelogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {uploadMessage && (
  <p className="text-red-500 text-sm mt-2 text-center">{uploadMessage}</p>
)}


        <button
          onClick={startvoice}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold my-3 py-2 px-4 rounded-md transition duration-200"
        >
          🎤 Speak to voice input
        </button>
      </div>
    </div>
  );
};

export default Adminlogin;
