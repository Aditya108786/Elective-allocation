
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { startvoiceRecognition } from "../Audioinput";

const Result = () => {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate()

  useEffect(() => {
    const storedRoll = sessionStorage.getItem("rollNo");

    if (!storedRoll) {
      setError("❌ You are not logged in. Please log in first.");
      return;
    }

    const fetchResult = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/result/${storedRoll}` , {
          withCredentials:true
        });
        const data = res.data;

        if (!data.allocated) {
          setError("⏳ Subjects not yet allocated. Please check back later.");
          return;
        }

        setStudent(data);
      } catch (err) {
        console.error("Fetch error:", err);
        if (err.response?.status === 404) {
          setError("❌ Result not found.");
        } else {
          setError("⚠️ Server error. Try again.");
        }
      }
    };

    fetchResult();
  }, []);

  const voicecommand=(transcript)=>{
          if(transcript.includes('back')){
               back()
          }else if(transcript.includes('download')){
              download()
          }else{
           toast.error("Unrecognizable voice")
          }
  }

  const startvoice = startvoiceRecognition(voicecommand)

  const download = () => {
    if (!student) return;

    const text = `
    Student Allocation Result
    --------------------------
    Roll No      : ${student.rollNo}
    Name         : ${student.name}
    CGPA         : ${student.cgpa}
    Allocated To : ${student.allocated}
    --------------------------
    `;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allocation-${student.rollNo}.txt`;
    a.click();
  };

  const back=()=>{
      navigate('/student-portal')
  }

  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <button
            onClick={() => navigate('/student-portal')}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md font-semibold"
          >
           Back
          </button>
        <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-white mb-6">
          🎓 Allocation Result
        </h2>

        {error && (
          <div className="text-red-600 bg-red-100 p-4 rounded mb-4 font-medium">
            {error}
          </div>
        )}

        {student && (
          <div className="space-y-4 text-gray-800 dark:text-gray-200">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Roll Number:</span>
              <span>{student.rollNo}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Name:</span>
              <span>{student.name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">CGPA:</span>
              <span>{student.cgpa}</span>
            </div>
            <div className="flex justify-between border-b pb-2 text-green-600 font-semibold">
              <span>Allocated Subject:</span>
              <span>{student.allocated}</span>
            </div>

            <button
              onClick={download}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-lg font-semibold transition-all duration-200"
            >
              📥 Download My Result
            </button>

            <button
              onClick={startvoice}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-lg font-semibold transition-all duration-200"
            >
              Speak to give voice input
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;
