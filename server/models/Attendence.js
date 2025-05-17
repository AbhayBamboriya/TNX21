const mongoose = require('mongoose');

// Schema for individual student's attendance
const StudentAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  isPresent: {
    type: Boolean,
    default: false
  },
  remark: {
    type: String,
    default: ''
  }
});

// Main attendance schema
const AttendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required for attendance']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  classSection: {
    type: String,
    required: [true, 'Class section is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  studentAttendance: [StudentAttendanceSchema],
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User who marked attendance is required']
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
AttendanceSchema.index({ date: 1, subject: 1, classSection: 1, academicYear: 1 });

// Create the Attendance model
const Attendance = mongoose.model('Attendance', AttendanceSchema);

module.exports = Attendance;