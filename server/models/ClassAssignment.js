const mongoose = require('mongoose');

const ClassAssignmentSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true
  },
  classSection: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for teacher class assignments
ClassAssignmentSchema.index({ academicYear: 1, teacher: 1 });
ClassAssignmentSchema.index({ academicYear: 1, classSection: 1 });

const ClassAssignment = mongoose.model('ClassAssignment', ClassAssignmentSchema);
module.exports = ClassAssignment;