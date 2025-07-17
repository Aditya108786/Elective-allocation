
const csv = require('csv-parser');
const { Readable } = require('stream');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

const SEAT_LIMIT = 20;
const SUBJECTS = ['S1', 'S2', 'S3', 'S4'];
let seatMap = {};

const uploadCGPAFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const stream = Readable.from(req.file.buffer);

    stream.pipe(csv())
      .on('data', (row) => {
        const { rollNo, name, cgpa } = row;
        if (rollNo && name && cgpa) {
          results.push({
            rollNo: rollNo.trim(),
            name: name.trim(),
            cgpa: parseFloat(cgpa)
          });
        }
      })
      .on('end', async () => {
        for (const studentdata of results) {
          await Student.findOneAndUpdate(
            { rollNo: studentdata.rollNo },
            { $set: studentdata },
            { upsert: true }
          );
        }
        res.status(200).json({ message: 'Students uploaded successfully' });
      });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const submitPreferences = async (req, res) => {
  try {
    const { rollNo, preferences } = req.body;

    if (!rollNo || !preferences || preferences.length !== 4) {
      return res.status(400).json({ error: 'Invalid roll number or preferences' });
    }

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    student.preferences = preferences;
    await student.save();

    res.status(200).json({ message: 'Preferences submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitPreferencesBulk = async (req, res) => {
  try {
    const updates = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid request format. Must be an array.' });
    }

    const results = [];

    for (let item of updates) {
      const { rollNo, preferences } = item;

      if (!rollNo || !preferences || preferences.length !== 4) {
        results.push({ rollNo, status: 'Failed', reason: 'Invalid data' });
        continue;
      }

      const student = await Student.findOne({ rollNo });
      if (!student) {
        results.push({ rollNo, status: 'Failed', reason: 'Student not found' });
        continue;
      }

      student.preferences = preferences;
      await student.save();
      results.push({ rollNo, status: 'Success' });
    }

    res.status(200).json({ message: 'Bulk preferences submitted', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const allocateSubjects = async (req, res) => {
  try {
    const seatMap = {};
    SUBJECTS.forEach(subject => seatMap[subject] = SEAT_LIMIT);

    const students = await Student.find().sort({ cgpa: -1, createdAt: 1 });

    for (let student of students) {
      for (let pref of student.preferences) {
        if (seatMap[pref] > 0) {
          student.allocated = pref;
          seatMap[pref]--;
          await student.save();
          break;
        }
      }
    }

    const result = students.map(s => ({
      rollNo: s.rollNo,
      name: s.name,
      cgpa: s.cgpa,
      registeredAt: s.createdAt,
      allocated: s.allocated || 'Not Allocated',
    }));

    res.status(200).json({ allocation: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetSystem = async (req, res) => {
  try {
    await Student.updateMany({}, { $set: { allocated: null } });
    seatMap = {};
    SUBJECTS.forEach((s) => {
      seatMap[s] = SEAT_LIMIT;
    });
    res.json({ message: 'System reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStudentByRollNo = async (req, res) => {
  try {
    const { rollNo } = req.params;

    if (!rollNo) {
      return res.status(400).json({ error: 'Roll Number is required' });
    }

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json({
      rollNo: student.rollNo,
      name: student.name,
      cgpa: student.cgpa,
      allocated: student.allocated || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { rollNo } = req.body;

    if (!rollNo) {
      return res.status(400).json({ error: 'Roll Number is required' });
    }

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const token = jwt.sign(
      { id: student._id, rollNo: student.rollNo },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Login successful",
      student,
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const adminlogin = async (req, res) => {
  try {
    const admin = process.env.ADMIN_NAME || "Aditya";
    const pass = process.env.PASSWORD || "12345678";

    const { username, password } = req.body;

    if (username !== admin || password !== pass) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ message: "Admin logged in successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const logoutAdmin = (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Logged out successfully" });
};

module.exports = {
  uploadCGPAFromCSV,
  submitPreferences,
  allocateSubjects,
  resetSystem,
  
  submitPreferencesBulk,
  getStudentByRollNo,
  login,
  adminlogin,
  logoutAdmin
};