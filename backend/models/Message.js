const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderRole: {
    type: String,
    enum: ['admin', 'cm'],
    required: true
  },
  encryptedContent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
