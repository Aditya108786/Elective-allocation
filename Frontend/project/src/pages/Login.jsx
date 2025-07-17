import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Authcontext";
import { startvoiceRecognition } from "../Audioinput";

const Authpage = () => {
  const [rollNo, setRollNo] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlecommand=(transcript)=>{
     if(transcript.includes("login", "")){
       handleLogin()
     }else if(transcript.includes("roll number")){
       const roll = transcript.replace("roll number", "").trim()
       setRollNo(roll)
     }else if(transcript.includes("homepage")){
          homepage()
     }else{
     toast.error("Unrecognizable voice command")
      return
     }
  }

  const startvoice = startvoiceRecognition(handlecommand)

  const handleLogin = async () => {
    if (!rollNo.trim()) {
     toast.error("Unrecognizable voice command")
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE}/api/login`,
        { rollNo },
        { withCredentials: true }
      );

      if (response.data?.student) {
        login(rollNo);
        navigate('/student-portal');
      } else {
        toast.error("❌ Login failed. Invalid roll number.");
      }
    } catch (error) {
      
      alert(error.response?.data?.error || "Something went wrong. Try again.");
    }
  };

  const homepage = ()=>{
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 relative">
      
      {/* 🏠 Home Button - Top-right corner */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md font-semibold"
      >
        🏠 Home
      </button>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-white mb-6">
          🎓 Student Login
        </h2>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Roll Number
        </label>
        <input
          type="text"
          placeholder="Enter your Roll Number"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white mb-4"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition-all"
        >
          🔐 Login
        </button>
        <button onClick={startvoice}  className="w-full bg-blue-600 hover:bg-blue-700 my-4 text-white font-semibold py-3 rounded-md transition-all">
           Speak to give voice input
        </button>

        <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
          Only registered students can access the portal.
        </p>
      </div>
    </div>
  );
};

export default Authpage;
