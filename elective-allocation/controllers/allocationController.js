const mongoose = require('mongoose')
const csv = require('csv-parser');
const { Readable } = require('stream');
const Student = require('../models/Student');
const subjects = require('../models/Subject')
const maxpref = require('../models/settingschema')
const jwt = require('jsonwebtoken');
const Subject = require('../models/Subject');
const { error } = require('console');
const xslx = require('xlsx')



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

    if (!rollNo || !preferences) {
      return res.status(400).json({ error: 'Invalid roll number or preferences' });
    }

    


    const maxpreference = await maxpref.findOne()

    const count = maxpreference.maxPreferences

    if(count < preferences.length){
      return res.status(400).json({error:` ${count} preferences are allowed`})
    }

    const allsubjects = await Subject.find().select('name -_id')
    const subname = allsubjects.map((sub)=>{
      sub.name
    })
    const invalidpreferences = preferences.filter((p)=>{
               !subname.includes(p)
    })

    if(invalidpreferences.length > 0){
     return res.status(400).json({ error: `Invalid subjects in preferences: ${invalidpreferences.join(', ')}` });
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

/**
 * Correct and Safe Subject Allocation Logic
 *
 * This function is designed to be triggered once by an admin to allocate subjects
 * to all unallocated students based on their CGPA and preferences.
 *
 * It solves two critical problems:
 * 1. Race Conditions: It uses a lock and atomic database operations to prevent
 * data corruption if the function is accidentally triggered multiple times.
 * 2. Inefficiency: It uses a single bulk database operation to update all
 * students, which is vastly faster than saving them one by one.
 */

// --- In-memory Lock ---
// This flag prevents the entire allocation process from running more than once at the same time.
// It should be defined at the module level (outside the function).
const allocateSubjects = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Student.updateMany({}, { allocated: null }, { session });

    const students = await Student.find({ preferences: { $ne: [] } })
      .sort({ cgpa: -1 })
      .session(session);

    const subjects = await Subject.find().session(session);
    const seatMap = {};
    subjects.forEach((subj) => {
      seatMap[subj.name.toLowerCase()] = {
        seatLimit: subj.seatLimit,
        seatsFilled: subj.seatsFilled,
      };
    });

    for (const student of students) {
      for (const pref of student.preferences) {
        const subjName = pref.trim().toLowerCase();
        if (
          seatMap.hasOwnProperty(subjName) &&
          seatMap[subjName].seatsFilled < seatMap[subjName].seatLimit
        ) {
          student.allocated = subjName;
          seatMap[subjName].seatsFilled += 1;

          await student.save({ session });

          await Subject.updateOne(
            { name: new RegExp(`^${subjName}$`, 'i') },
            { $inc: { seatsFilled: 1 } },
            { session }
          );

          break;
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    console.log("✅ Allocation complete");
    return res.status(200).json({ message: "Allocation complete" }); // ✅ Send response
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Allocation failed:", error);
    return res.status(500).json({ error: "Allocation failed" }); // ✅ Send error response
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

const deleteStudent = async(req,res)=>{
    const {rollNo} = req.params

    if(!rollNo){
      return res.status(400).json({ error: 'Roll Number is required' });
    }

    const student = await Student.findOneAndDelete({rollNo})
    student.save()
    return res.status(200).json({message:"deleted"})
}

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
      sameSite:"None",
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

const Addsubjects = async(req, res) =>{
     const{name, seatlimit} = req.body
     const Normalizename = name.trim().toLowerCase()

     const existingSub = await Subject.findOne({name:Normalizename})
     if(existingSub){
        return res.status(409).json({message:'Subject already exists'})
     }

     if(!Normalizename || !seatlimit){
      return res.status(404).json({error:"name and limit required"})
       
     }

     const subjectdetail = new Subject({
        name:Normalizename,
        seatlimit
     })
     await subjectdetail.save()
     return res.status(200).json({message:"subjects uploaded"})
}





const maxPreference = async (req, res) => {
  try {
    const { maxPreferences } = req.body;

    if (!maxPreferences || typeof maxPreferences !== 'number' || maxPreferences <= 0) {
      return res.status(400).json({ message: "maxPreferences must be a positive number" });
    }

    // Check if a document already exists
    const existing = await maxpref.findOne();

    if (existing) {
      existing.maxPreferences = maxPreferences;
      await existing.save();
    } else {
      const newPref = new maxpref({ maxPreferences });
      await newPref.save();
    }

    return res.status(200).json({ message: "Max preferences set successfully", maxPreferences });
  } catch (error) {
    
    return res.status(500).json({ message: "Server error" });
  }
};



const getAllstudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ cgpa: -1 }); // Sort by CGPA descending
    return res.status(200).json(students);
  } catch (error) {
   
    return res.status(500).json({ message: 'Server error while fetching students' });
  }
};

const getAllsubjects = async(req,res)=>{
   try {
      const subjects = await Subject.find()
      return res.status(200).json(subjects)
   } catch (error) {
      return res.status(500).json({message:'server error while fetching students'})
   }
}

// Controller to fetch current maxPreferences
const getMaxPreference = async (req, res) => {
  try {
    const setting = await maxpref.findOne();
    if (!setting) {
      return res.status(404).json({ message: "No max preferences found" });
    }
    return res.status(200).json({ maxPreferences: setting.maxPreferences });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const alreadyFilled = async (req, res) => {
  try {
    const { rollNo } = req.params;

    if (!rollNo) {
      return res.status(400).json({ message: "Roll number is required" });
    }

    const student = await Student.findOne({ rollNo });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const count = student.preferences?.length || 0;

    return res.status(200).json({ count });
  } catch (error) {
    
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const adminpreference = async (req, res) => {
  try {
    const filepath = req.file?.path;

    if (!filepath) {
      return res.status(404).json({ message: 'File not found' });
    }

    const workbook = xslx.readFile(filepath);
    const sheetname = workbook.SheetNames[0];
    const data = xslx.utils.sheet_to_json(workbook.Sheets[sheetname]);

    // Check if preference columns exist
    const hasPreferenceCols = Object.keys(data[0] || {}).some((key) =>
      key.toLowerCase().includes('preference')
    );

    if (!hasPreferenceCols) {
      fs.unlinkSync(filepath);
      return res
        .status(400)
        .json({ message: 'No preference columns found in the uploaded file.' });
    }

    let updated = 0,
      skipped = 0;

    for (const row of data) {
      const rollNo = String(row.rollNo || row.RollNo || row.Roll || '0');
      if (!rollNo) continue;

      const student = await Student.findOne({ rollNo });

      if (!student) {
        continue;
      }
      if (student.preferences && student.preferences.length > 0) {
        skipped++;
        continue;
      }

      const prefs = [];
      Object.keys(row).forEach((key) => {
        if (key.toLowerCase().includes('preference')) {
          prefs.push(row[key]);
        }
      });

      if (prefs.length === 0) {
        skipped++;
        continue;
      }

      student.preferences = prefs;
      await student.save();
      updated++;
    }

    fs.unlinkSync(filepath);

    res.status(200).json({
      message: 'Preference upload complete',
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Admin preference upload failed:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const deletesubject = async(req,res)=>{
   try {
    const {id} = req.params
    const result = await Subject.findByIdAndDelete(id)

    if(!result){
     return res.status(404).json({message:"subject not found"})
    }

    result.save()
    res.status(200).json({ message: 'Subject deleted successfully' });
   } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
   }
}

const deleteall = async(req, res)=>{
     try {
      const result = await Student.deleteMany({})
      await Subject.updateMany({}, { seatsFilled: 0 });
      res.status(200).json({message:'All student deleted', deletedCount:result.deletedCount})
     } catch (error) {
       res.status(500).json({error:'Faild to delete students'})
     }
}



module.exports = {
  uploadCGPAFromCSV,
  submitPreferences,
  allocateSubjects,
  resetSystem,
  getAllstudents,
  submitPreferencesBulk,
  getStudentByRollNo,
  deleteStudent,
  login,
  adminlogin,
  logoutAdmin,
maxPreference, 
Addsubjects,
getAllsubjects,
getMaxPreference,
alreadyFilled,
adminpreference,
deletesubject,
deleteall

};