
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
    default: [],
    validate: {
      validator: function (v) {
        return v.length <= 4;
      },
      message: 'Only up to 4 preferences are allowed.'
    }
  },
  allocated: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);