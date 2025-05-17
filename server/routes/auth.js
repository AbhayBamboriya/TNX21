const express = require('express');
const User = require('../Models/User');
const { uploadStudentList } = require('./uploadStudentList');
const router = express.Router();


router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, grade, subjects } = req.body;
    console.log('reached');
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    console.log(name,email);
    
    const userData = {
      name,
      email,
      password,
      role
    };
    
    console.log('dfkf');
    
    if (role === 'student') {
      userData.grade = grade;
    } else if (role === 'teacher') {
      userData.subjects = subjects;
    }
    
    user = new User(userData);
    await user.save();
    console.log('ww');
    
    // const token = User.getSignedJwtToken();
    console.log('dsf');
    console.log(
        'sdk'
    );
    
    res.status(201).json({
      success: true,
    //   token,`
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    // console.error("g",err.message);
    return res.status(500).json({ msg: 'Something went wrong' })
    // return res.status(400).json({ msg: 'User already exists' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials'});
    }
    
    const token = user.getSignedJwtToken();
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
router.post('/upload', uploadStudentList);

// Route to get students list for a specific class and academic year
router.get('/list', getStudentsList);

// Route to get students list for taking attendance
router.get('/students', getStudentsForAttendance);

// Route to mark attendance
router.post('/mark', markAttendance);

module.exports = router;
