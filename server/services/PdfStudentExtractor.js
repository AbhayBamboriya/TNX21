const pdf = require('pdf-parse');
const Student = require('../models/Student');

class PdfStudentExtractor {
  /**
   * Extract student data from PDF buffer
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {String} academicYear - Academic year
   * @param {String} classSection - Class and section
   * @param {String} createdBy - Admin user ID
   * @returns {Array} Array of student objects
   */
  static async extractStudentsFromPdf(pdfBuffer, academicYear, classSection, createdBy) {
    try {
      // Parse PDF content
      const data = await pdf(pdfBuffer);
      const text = data.text;
      
      // Split text into lines and filter empty lines
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      // Pattern specifically for GSITS attendance sheet format
      // Format: "1 0801CS221104 PALAK CHOUDHARY 8 7 88 3 3 100..."
      const attendancePattern = /^\s*\d+\s+(0801\w+\d+)\s+([A-Z][A-Z\s]+)(?:\s+\d+|\s+\d+\s+\d+|\s+\d+\s+\d+\s+\d+)/;
      
      // General enrollment pattern as fallback
      const enrollmentPattern = /\b([0-9]{4}[A-Z]{2}[0-9]{6})\s+([A-Z][A-Z\s]+)\b/;
      
      const students = [];
      
      // First pass: Extract using attendance sheet pattern
      for (const line of lines) {
        let match = line.match(attendancePattern);
        
        if (match) {
          const enrollmentNo = match[1].trim();
          const studentName = match[2].trim();
          
          // Make sure we have a valid name (at least 2 characters)
          if (studentName && studentName.length >= 2) {
            // Check for duplicates before adding
            const isDuplicate = students.some(s => s.admissionNumber === enrollmentNo);
            if (!isDuplicate) {
              students.push({
                name: studentName,
                rollNumber: students.length + 1, // Sequential roll number
                admissionNumber: enrollmentNo,   // Use enrollment number as admission number
                academicYear,
                classSection,
                createdBy
              });
            }
          }
        }
      }
      
      // If first pattern didn't find enough students, try the general enrollment pattern
      if (students.length < 5) {
        for (const line of lines) {
          const match = line.match(enrollmentPattern);
          
          if (match) {
            const enrollmentNo = match[1].trim();
            const studentName = match[2].trim();
            
            // Check for duplicates before adding
            const isDuplicate = students.some(s => s.admissionNumber === enrollmentNo);
            if (!isDuplicate && studentName && studentName.length >= 2) {
              students.push({
                name: studentName,
                rollNumber: students.length + 1,
                admissionNumber: enrollmentNo,
                academicYear,
                classSection,
                createdBy
              });
            }
          }
        }
      }
      
      // If still no students, try a more relaxed pattern (might catch more cases but with lower precision)
      if (students.length === 0) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Look for patterns like "NUMBER NAME" where NAME is in UPPERCASE
          const relaxedMatch = line.match(/\s*\d+\s+([\w]+)\s+([A-Z][A-Z\s]+)/);
          if (relaxedMatch) {
            const possibleId = relaxedMatch[1].trim();
            const possibleName = relaxedMatch[2].trim();
            
            // Check if it looks like an enrollment/admission number
            if (possibleId.length >= 8 && possibleName.length >= 2) {
              students.push({
                name: possibleName,
                rollNumber: students.length + 1,
                admissionNumber: possibleId,
                academicYear,
                classSection,
                createdBy
              });
            }
          }
        }
      }
      
      // Normalize student data before returning
      const normalizedStudents = students.map((student, index) => ({
        ...student,
        // Ensure roll numbers are sequential if not already assigned
        rollNumber: student.rollNumber || (index + 1),
        // Normalize name (remove extra spaces)
        name: student.name.replace(/\s+/g, ' ').trim()
      }));
      
      return normalizedStudents;
    } catch (error) {
      console.error('Error extracting students from PDF:', error);
      throw new Error(`Failed to extract student data: ${error.message}`);
    }
  }

  /**
   * Save students to database
   * @param {Array} students - Array of student objects
   * @returns {Number} Number of students saved
   */
  static async saveStudentsToDatabase(students) {
    try {
      // Check for duplicates based on admission number or roll number in the same class and year
      const savedCount = await Promise.all(students.map(async (student) => {
        const existingStudent = await Student.findOne({
          $and: [
            { academicYear: student.academicYear },
            { classSection: student.classSection },
            { 
              $or: [
                { admissionNumber: student.admissionNumber },
                { 
                  $and: [
                    { name: student.name }
                  ]
                }
              ]
            }
          ]
        });

        if (existingStudent) {
          // Update existing student if needed
          const needsUpdate = existingStudent.name !== student.name;
          if (needsUpdate) {
            await Student.findByIdAndUpdate(existingStudent._id, {
              name: student.name
            });
          }
          return 0; // Counting as update, not new save
        } else {
          // Create new student
          await Student.create(student);
          return 1;
        }
      }));

      // Count how many new students were saved (not updated)
      return savedCount.reduce((a, b) => a + b, 0);
    } catch (error) {
      console.error('Error saving students to database:', error);
      throw new Error(`Failed to save student data: ${error.message}`);
    }
  }
}

module.exports = PdfStudentExtractor;