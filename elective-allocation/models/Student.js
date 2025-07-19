
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  cgpa: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  preferences: {
    type: [String],
    default: []
    
  },
  allocated: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);