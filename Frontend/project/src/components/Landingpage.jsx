import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { startvoiceRecognition } from "../Audioinput";

const LandingPage = () => {
  const navigate = useNavigate();

  const studentportal = () => {
    navigate('/Login');
  };

  const admin = () => {
    navigate('/adminlogin');
  };

  const voicecommand = (transcript) => {
    if (transcript.includes("student portal")) {
      studentportal();
    } else if (transcript.includes("admin panel")) {
      admin();
    } else {
      // Optional: remove in production or replace with toast if needed
      console.warn("Unrecognized voice command:", transcript);
    }
  };

  const startvoice = startvoiceRecognition(voicecommand);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-between px-6 py-10">
      
      {/* Top Section */}
      <header className="text-center mt-10">
        <h1 className="text-4xl font-extrabold text-blue-800 dark:text-white tracking-tight">
          🏛 University Elective Allocation System
        </h1>
        <p className="text-lg mt-3 text-gray-700 dark:text-gray-300 max-w-xl mx-auto">
          An intelligent platform to streamline elective subject allocation based on CGPA & student preferences.
        </p>
      </header>

      {/* Main Action Buttons */}
      <main className="flex flex-col md:flex-row items-center gap-8 mt-16">
        <Link to="/Login">
          <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all duration-200">
            🎓 Student Portal
          </button>
        </Link>
        <Link to="/adminlogin">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all duration-200">
            🛡 Admin Panel
          </button>
        </Link>
      </main>

      <button 
        onClick={startvoice} 
        className="bg-blue-600 hover:bg-blue-700 text-white my-5 px-4 py-2 rounded-md font-semibold"
      >
        Speak to give voice input
      </button>

      {/* Footer Section */}
      <footer className="mt-24 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; 2025 Department of Computer Science. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;