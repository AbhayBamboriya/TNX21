const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const path = require('path');
const StudentRecord = require('../models/StudentRecord'); // ✅ Use this model

const parseAndSaveStudents = async (fileBuffer, originalname, metaData = {}) => {
  const ext = path.extname(originalname).toLowerCase();
  let studentsData = [];

  if (ext === '.pdf') {
    const data = await pdfParse(fileBuffer);
    const text = data.text;
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    lines.forEach(line => {
      const match = line.match(/Name:\s*(.+),\s*Enrollment:\s*(\w+)/i);
      if (match) {
        studentsData.push({
          name: match[1].trim(),
          enrollment: match[2].trim(),
        });
      }
    });

  } else if (ext === '.xls' || ext === '.xlsx') {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    jsonData.forEach(row => {
      if (row.name && row.enrollment) {
        studentsData.push({
          name: row.name,
          enrollment: row.enrollment.toString(),
        });
      }
    });

  } else {
    throw new Error('Unsupported file type');
  }

  const { year = '2024', semester = 1, section = 'A' } = metaData;
  const savedStudents = [];

  for (const studentData of studentsData) {
    const student = new StudentRecord({
      name: studentData.name,
      enrollment: studentData.enrollment,
      year,
      semester,
      section,
    });

    await student.save();
    savedStudents.push(student);
  }

  return savedStudents;
};

module.exports = parseAndSaveStudents;
