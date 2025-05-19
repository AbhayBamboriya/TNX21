const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentEnrollment: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  attendanceRecords: [
    {
      date: { type: Date, required: true },
      present: { type: Boolean, required: true },
    }
  ],
  totalClasses: {
    type: Number,
    default: 0,
  },
  totalClassesAttended: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
