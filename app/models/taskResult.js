const mongoose = require('mongoose');

const taskResultSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  dateTime:{
    type: Date
  },
  time:{
    type: String
  },
  date:{
    type: Date
  },
}, { timestamps: true });

module.exports = mongoose.model('AttDataFromMyBas', taskResultSchema);
