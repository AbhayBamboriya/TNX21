const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Your Student model
const Student = require('../models/Student'); // adjust path as needed

// Multer setup for file upload (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const { originalname, buffer } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    let studentsData = [];

    if (ext === '.pdf') {
      // Parse PDF file buffer
      const data = await pdfParse(buffer);

      // Extract text (you may need to adjust parsing based on your PDF structure)
      const text = data.text;

      // Example: Assume each student info is on one line: "Name: John Doe, Enrollment: 12345"
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

      lines.forEach(line => {
        // Basic regex to extract name and enrollment from each line
        const match = line.match(/Name:\s*(.+),\s*Enrollment:\s*(\w+)/i);
        if (match) {
          studentsData.push({
            name: match[1].trim(),
            enrollment: match[2].trim(),
          });
        }
      });

    } else if (ext === '.xls' || ext === '.xlsx') {
      // Parse Excel file buffer
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Assume Excel columns contain `name` and `enrollment` headers, adjust if different
      jsonData.forEach(row => {
        if (row.name && row.enrollment) {
          studentsData.push({
            name: row.name,
            enrollment: row.enrollment.toString(),
          });
        }
      });

    } else {
      return res.status(400).json({ msg: 'Unsupported file type' });
    }

    // Add year, semester, section as needed here (from req.body or hardcoded for now)
    const year = req.body.year || '2024'; // Example, get these from request if sent
    const semester = req.body.semester || 1;
    const section = req.body.section || 'A';

    // Save extracted students to DB
    const savedStudents = [];

    for (const studentData of studentsData) {
      const student = new Student({
        name: studentData.name,
        enrollment: studentData.enrollment,
        year,
        semester,
        section,
      });
      await student.save();
      savedStudents.push(student);
    }

    res.json({
      msg: 'Students uploaded successfully',
      count: savedStudents.length,
      students: savedStudents,
    });
  } catch (err) {
    console.error('Error uploading students:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
