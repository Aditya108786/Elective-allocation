
const csv = require('csv-parser');
const { Readable } = require('stream');
const Student = require('../models/Student');
const subjects = require('../models/Subject')
const maxpref = require('../models/settingschema')
const jwt = require('jsonwebtoken');
const Subject = require('../models/Subject');
const { error } = require('console');



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

    const maxpreference = await maxpref.findOne()

    const count = maxpreference.maxPreferences

    if(count !== preferences.length){
      return res.status(400).json({error:`Exactly ${count} preferences are allowed`})
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

const allocateSubjects = async (req, res) => {
  try {
    const seatMap = {};
    const subjects = await Subject.find({})
    const students = await Student.find({allocated:null}).sort({ cgpa: -1, createdAt: 1 });

    subjects.forEach((subject)=>{
       seatMap[subject.name] = {
         _id:subject._id,
         seatlimit:subject.seatlimit,
         seatsfilled:subject.seatsFilled || 0
       }
    })



    for (let student of students) {
      for (let pref of student.preferences) {
        let subject = seatMap[pref]

        if(subject && subject.seatlimit > subject.seatsFilled){
          student.allocated = pref
          subject.seatsFilled += 1

          await student.save()
          break
        }
      }
    }

    for(const subjname in seatMap){
         await Subject.findByIdAndUpdate(seatMap[subjname]._id , {
            seatsFilled:seatMap[subjname].seatsFilled
         })
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

     if(!name || !seatlimit){
      return res.status(404).json({error:"name and limit required"})
       
     }

     const subjectdetail = new subjects({
        name,
        seatlimit
     })
     await subjectdetail.save()
     return res.status(200).json({message:"subjects uploaded"})
}

const maxPreference = async(req,res)=>{
    const{maxPreferences} = req.body

    if(!maxPreferences){
      return res.status(404).json({message:"required"})
    }

    const maxpre = new maxpref({
      maxPreferences
    })
   await maxpre.save()
   return res.status(200).json({message:"fixed"})
}

const getAllstudents = async(req,res)=>{
    const students = await Student.find().sort({cgpa})
   return res.status(200).json(students)
}

const getAllsubjects = async(req,res)=>{
  const allsubjects = await Subject.find()
  return res.status(200).json(allsubjects)
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
getAllsubjects
};