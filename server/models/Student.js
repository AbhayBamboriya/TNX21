const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  rollNumber: {
    type: Number,
    required: [true, 'Roll number is required']
  },
  admissionNumber: {
    type: String,
    required: [true, 'Admission/Enrollment number is required'],
    unique: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  classSection: {
    type: String,
    required: [true, 'Class section is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for faster lookups
StudentSchema.index({ academicYear: 1, classSection: 1, rollNumber: 1 });
StudentSchema.index({ academicYear: 1, classSection: 1, admissionNumber: 1 });

// Create the Student model
const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;