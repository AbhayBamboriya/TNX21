const express = require('express');
const User = require('../Models/User');
const { uploadStudentList } = require('./uploadStudentList');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();


router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, grade, subjects, enrollmentNo } = req.body;

    if (role === 'student') {
      if (!enrollmentNo || !grade) {
        return res.status(400).json({ msg: 'Enrollment number and grade are required for students' });
      }

      let existingStudent = await User.findOne({ enrollmentNo });
      if (existingStudent) {
        return res.status(400).json({ msg: 'Student with this enrollment number already exists' });
      }

      const student = new User({
        enrollmentNo,
        role: 'student',
        grade
      });

      await student.save();

      return res.status(201).json({
        success: true,
        user: {
          id: student._id,
          enrollmentNo: student.enrollmentNo,
          role: student.role,
          grade: student.grade
        }
      });

    } else {
      // Signup logic for teacher or other roles
      if (!name || !email || !password || !role) {
        return res.status(400).json({ msg: 'Missing required fields for teacher/admin' });
      }

      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists with this email' });
      }

      const newUser = new User({
        name,
        email,
        password,
        role,
        subjects: role === 'teacher' ? subjects : undefined
      });

      await newUser.save();

      return res.status(201).json({
        success: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          subjects: newUser.subjects
        }
      });
    }

  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ msg: 'Something went wrong' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, enrollment, password } = req.body;

    let user;

    if (enrollment) {
      // Login by enrollment for students
      user = await User.findOne({ enrollment });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid enrollment number or password' });
      }
    } else if (email) {
      // Login by email for teacher/admin
      user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid email or password' });
      }
    } else {
      return res.status(400).json({ msg: 'Please provide enrollment or email' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        enrollment: user.enrollment || null,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Apply authentication middleware for all routes
router.use(authMiddleware);

// Route to upload and process student list PDF
// router.post('/upload', uploadStudentList);

// // Route to get students list for a specific class and academic year
// router.get('/list', getStudentsList);

// // Route to get students list for taking attendance
// router.get('/students', getStudentsForAttendance);

// // Route to mark attendance
// router.post('/mark', markAttendance);

module.exports = router;
