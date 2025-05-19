const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  enrollmentNo: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (value) {
        // Required only if role is student
        if (this.role === 'student') {
          return value != null && value.trim() !== '';
        }
        return true;
      },
      message: 'Enrollment number is required for students'
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (value) {
        // Required only if role is NOT student
        if (this.role !== 'student') {
          return value != null && value.trim() !== '';
        }
        return true;
      },
      message: 'Email is required for non-students'
    }
  },
  password: {
    type: String,
    required: function () {
      return this.role !== 'student'; // only required for non-students
    }
  },
  name: {
    type: String
  },
  grade: {
    type: String,
    required: function () {
      return this.role === 'student';
    }
  },
  subjects: {
    type: [String]
  }
});

module.exports = mongoose.model('User', UserSchema);
