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
  try {
    // Handle file upload with multer
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Validate required fields
    const { academicYear, classSection } = req.body;
    if (!academicYear || !classSection) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        errors: ['Academic year and class section are required']
      });
    }
    
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
      req.user ? req.user.id : null // Admin user ID from auth middleware
    );
    
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
      message: `Student list successfully processed. Added ${savedCount} new students.`,
      studentsCount: savedCount,
      totalStudents: students.length,
      academicYear,
      classSection,
      students: students.map(s => ({
        name: s.name,
        enrollmentNumber: s.admissionNumber, // Use admission number field for enrollment
        rollNumber: s.rollNumber
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
};

/**
 * Get students list for a specific class and academic year
 */
const getStudentsList = async (req, res) => {
  try {
    const { academicYear, classSection } = req.query;
    
    if (!academicYear || !classSection) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        errors: ['Academic year and class section are required']
      });
    }

    // Get students from database for the specified class and academic year
    const students = await Student.find({ 
      academicYear, 
      classSection 
    }).sort({ rollNumber: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Students list retrieved successfully',
      studentsCount: students.length,
      students: students.map(student => ({
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.admissionNumber
      }))
    });
    
  } catch (error) {
    console.error('Error in getStudentsList:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students list',
      errors: [error.message]
    });
  }
};

module.exports = { 
  uploadStudentList,
  getStudentsList
};