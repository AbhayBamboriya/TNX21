const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

/**
 * Get students list for taking attendance
 */
const getStudentsForAttendance = async (req, res) => {
  try {
    const { academicYear, classSection, date, subject } = req.query;
    
    if (!academicYear || !classSection || !date || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        errors: ['Academic year, class section, date, and subject are required']
      });
    }

    // Check if teacher is authorized to take attendance for this class
    const isAuthorized = await checkTeacherAuthorization(req.user.id, classSection, subject);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
        errors: ['You are not authorized to take attendance for this class and subject']
      });
    }

    // Convert date string to Date object
    const attendanceDate = new Date(date);
    
    // Get students from database for the specified class and academic year
    const students = await Student.find({ 
      academicYear, 
      classSection 
    }).sort({ rollNumber: 1 });
    
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found',
        errors: ['No students found for the specified class and academic year']
      });
    }

    // Check if attendance has already been marked for this date and subject
    const existingAttendance = await Attendance.findOne({
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
      },
      subject,
      classSection,
      academicYear
    });

    // Map student data with existing attendance if available
    const studentsWithAttendance = students.map(student => {
      const attendanceStatus = existingAttendance?.studentAttendance?.find(
        a => a.studentId.toString() === student._id.toString()
      );

      return {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.admissionNumber,
        isPresent: attendanceStatus ? attendanceStatus.isPresent : false,
        remark: attendanceStatus ? attendanceStatus.remark : ''
      };
    });
    
    return res.status(200).json({
      success: true,
      message: 'Students list retrieved successfully',
      attendanceExists: !!existingAttendance,
      attendanceId: existingAttendance?._id || null,
      date: date,
      subject: subject,
      classSection: classSection,
      academicYear: academicYear,
      studentsCount: students.length,
      students: studentsWithAttendance
    });
    
  } catch (error) {
    console.error('Error in getStudentsForAttendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students list for attendance',
      errors: [error.message]
    });
  }
};

/**
 * Check if teacher is authorized to take attendance for this class and subject
 * @param {String} teacherId - Teacher ID
 * @param {String} classSection - Class and section
 * @param {String} subject - Subject
 * @returns {Boolean} - True if authorized, false otherwise
 */
const checkTeacherAuthorization = async (teacherId, classSection, subject) => {
  try {
    // This is a placeholder function - implement according to your user/role model
    // For example, check if teacher is assigned to this class and subject in your database
    
    // Placeholder implementation - always returns true for testing
    return true;
    
    // Real implementation would be something like:
    /*
    const teacherAssignment = await TeacherAssignment.findOne({
      teacherId,
      classSection,
      subject
    });
    
    return !!teacherAssignment;
    */
  } catch (error) {
    console.error('Error checking teacher authorization:', error);
    return false;
  }
};

/**
 * Mark attendance for students
 */
const markAttendance = async (req, res) => {
  try {
    const { academicYear, classSection, date, subject, studentAttendance } = req.body;
    
    if (!academicYear || !classSection || !date || !subject || !studentAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        errors: ['Academic year, class section, date, subject, and student attendance are required']
      });
    }

    // Check if teacher is authorized to take attendance for this class
    const isAuthorized = await checkTeacherAuthorization(req.user.id, classSection, subject);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
        errors: ['You are not authorized to take attendance for this class and subject']
      });
    }

    // Convert date string to Date object
    const attendanceDate = new Date(date);
    
    // Check if attendance already exists for this date, subject, class
    let attendance = await Attendance.findOne({
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
      },
      subject,
      classSection,
      academicYear
    });

    if (attendance) {
      // Update existing attendance
      attendance.studentAttendance = studentAttendance;
      attendance.markedBy = req.user.id;
      attendance.updatedAt = Date.now();
      await attendance.save();

      return res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        attendanceId: attendance._id
      });
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        date: attendanceDate,
        subject,
        classSection,
        academicYear,
        studentAttendance,
        markedBy: req.user.id
      });

      return res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        attendanceId: attendance._id
      });
    }
    
  } catch (error) {
    console.error('Error in markAttendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      errors: [error.message]
    });
  }
};

module.exports = {
  getStudentsForAttendance,
  markAttendance
};