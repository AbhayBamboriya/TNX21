const mongoose = require('mongoose');

const StudentRecordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  enrollment: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true }
});

module.exports = mongoose.model('StudentRecord', StudentRecordSchema);
