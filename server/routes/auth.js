const express = require('express');
const User = require('../Models/User');
const { uploadStudentList } = require('./uploadStudentList');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const parseAndSaveStudents = require('../controller/uploadStudentData');
const router = express.Router();

const bcrypt = require('bcryptjs');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, grade, subjects, enrollmentNo } = req.body;
    console.log('checking');
    
    // Check if password is provided
    if (!password) {
      return res.status(400).json({ msg: 'Password is required for all users' });
    }

    // const hashedPas/sword = await bcrypt.hash(password, 10); // Hashing the password

    if (role === 'student') {
      if (!enrollmentNo || !grade) {
        return res.status(400).json({ msg: 'Enrollment number and grade are required for students' });
      }

      let existingStudent = await User.findOne({ enrollmentNo });
      if (existingStudent) {
        return res.status(400).json({ msg: 'Student with this enrollment number already exists' });
      }

      const student = new User({
        name,
        enrollmentNo,
        role: 'student',
        grade,
        password: password,
      });

      await student.save();

      return res.status(201).json({
        success: true,
        user: {
          id: student._id,
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          role: student.role,
          grade: student.grade
        }
      });

    } else {
      // Signup logic for teacher/admin
      if (!name || !email || !role) {
        return res.status(400).json({ msg: 'Missing required fields for teacher/admin' });
      }

      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists with this email' });
      }

      const newUser = new User({
        name,
        email,
        password: password,
        role,
        subjects: role === 'teacher' ? subjects : undefined
      });
      console.log(newUser);
      
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
    const { email, enrollmentNo, password } = req.body;

    // let user;

    if (enrollmentNo) {
      // Login by enrollment for students
      user = await User.findOne({ enrollmentNo });
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
      return res.status(400).json({ msg: 'Please provide correct enrollment or email' });
    }
    console.log(user);
    
    // Check password
    // const isMatch = await bcrypt.compare(password, user.password);

    // const isMatch = await user.matchPassword(password);
    // console.log(password,isMatch);
    
    if (user.password!=password) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = user.generateJWTToken();

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


const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload-students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const savedStudents = await parseAndSaveStudents(
      req.file.buffer,
      req.file.originalname,
      {
        year: req.body.year,
        semester: req.body.semester,
        section: req.body.section
      }
    );

    res.json({
      msg: 'Students uploaded successfully',
      count: savedStudents.length,
      students: savedStudents,
    });
  } catch (err) {
    console.error('Error uploading students:', err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

module.exports = router;
