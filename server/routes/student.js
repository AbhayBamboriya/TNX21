const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get students by class and section
router.get('/class/:class/section/:section', async (req, res) => {
  try {
    const students = await Student.find({ 
      class: req.params.class,
      section: req.params.section
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific student
router.get('/:id', getStudent, (req, res) => {
  res.json(res.student);
});

// Create a new student
router.post('/', async (req, res) => {
  const student = new Student({
    name: req.body.name,
    rollNo: req.body.rollNo,
    class: req.body.class,
    section: req.body.section,
    attendance: req.body.attendance || 0
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a student
router.patch('/:id', getStudent, async (req, res) => {
  if (req.body.name != null) {
    res.student.name = req.body.name;
  }
  if (req.body.rollNo != null) {
    res.student.rollNo = req.body.rollNo;
  }
  if (req.body.class != null) {
    res.student.class = req.body.class;
  }
  if (req.body.section != null) {
    res.student.section = req.body.section;
  }
  if (req.body.attendance != null) {
    res.student.attendance = req.body.attendance;
  }
  res.student.updatedAt = Date.now();

  try {
    const updatedStudent = await res.student.save();
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update attendance for a student
router.patch('/:id/attendance', getStudent, async (req, res) => {
  if (req.body.attendance != null) {
    res.student.attendance = req.body.attendance;
    res.student.updatedAt = Date.now();
    
    try {
      const updatedStudent = await res.student.save();
      res.json(updatedStudent);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else {
    res.status(400).json({ message: "Attendance value is required" });
  }
});

// Delete a student
router.delete('/:id', getStudent, async (req, res) => {
  try {
    await res.student.remove();
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
