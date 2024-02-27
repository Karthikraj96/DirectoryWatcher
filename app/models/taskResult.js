const mongoose = require('mongoose');

const taskResultSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  filesAdded: [{
    type: String
  }],
  filesDeleted: [{
    type: String
  }],
  magicString:{
    type: String
  },
  magicStringOccurrences: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TaskResult', taskResultSchema);
