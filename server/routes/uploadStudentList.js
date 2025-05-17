const multer = require('multer');
const PdfStudentExtractor = require('../services/PdfStudentExtractor');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('studentListPdf');

/**
 * Upload and process student list from PDF
 */
const uploadStudentList = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        errors: [err.message]
      });
    }
    console.log('gggg');
    
    try {
      // Validate required fields
      const { academicYear, classSection } = req.body;
      if (!academicYear || !classSection) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          errors: ['Academic year and class section are required']
        });
      }
      console.log('loig');
      
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded',
          errors: ['Please upload a valid PDF file']
        });
      }
      
      // Extract student data from PDF
      const students = await PdfStudentExtractor.extractStudentsFromPdf(
        req.file.buffer,
        academicYear,
        classSection,
        // req.user.id // Admin user ID from auth middleware
      );
      console.log('abcd');
      
      if (!students || students.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No student data found in the uploaded PDF',
          errors: ['The PDF does not contain recognizable student information']
        });
      }
      
      // Save students to database
      const savedCount = await PdfStudentExtractor.saveStudentsToDatabase(students);
      
      // Return success response with extracted students
      return res.status(200).json({
        success: true,
        message: 'Student list successfully processed',
        studentsCount: savedCount,
        academicYear,
        classSection,
        students: students.map(s => ({
          id: s._id,
          name: s.name,
          rollNumber: s.rollNumber,
          admissionNumber: s.admissionNumber
        }))
      });
    } catch (error) {
      console.error('Error in uploadStudentList:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process student list',
        errors: [error.message]
      });
    }
  });
};

module.exports = { uploadStudentList };