const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a complaint title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: [
      // Original categories
      'Roads & Infrastructure', 
      'Utilities', 
      'Environment', 
      'Noise', 
      'Vandalism', 
      'Other',
      // Emergency categories
      'Gas Leakage',
      'Building Collapse',
      'Electrocution',
      'Critical Fire',
      'Emergency Other',
      // ML Government categories
      'Roads',
      'Water',
      'Electricity',
      'Sanitation',
      'Health',
      'Public Transport',
    ]
  },
  // ML-assigned government category
  mlCategory: {
    type: String,
    enum: ['Roads', 'Water', 'Electricity', 'Sanitation', 'Health', 'Public Transport', null],
    default: null
  },
  // ML confidence score (0-1)
  mlConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  location: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Please add a location']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  status: {
    type: String,
    enum: ['Pending', 'initiated', 'under_review', 'construction_ongoing', 'fixing_issues', 'resolved', 'In Progress', 'Escalated', 'Resolved'],
    default: 'initiated'
  },
  updates: [{
    status: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  proofImage: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  landmark: {
    type: String,
    required: [true, 'Please add a landmark/street address']
  },
  occurrenceDate: {
    type: Date,
    required: [true, 'Please add the date/time the issue was noticed']
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: [true, 'Please select urgency level']
  },
  impactScale: {
    type: String,
    enum: ['Individual', 'Few neighbors', 'Whole street/community'],
    required: [true, 'Please select the impact scale']
  },
  contactPreference: {
    type: String,
    enum: ['Email', 'Phone', 'SMS'],
    required: [true, 'Please select contact preference']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  resolvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  // Resolution metadata — used by the "Solved Problems" view
  resolvedAt: {
    type: Date,
    default: null
  },
  resolverName: {
    type: String,
    default: ''
  },
  resolverEmail: {
    type: String,
    default: ''
  },
  falseClosureReport: {
    isReported: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
  },
  // Community voting — number of citizens who upvoted this complaint
  votes: {
    type: Number,
    default: 0
  },
  // User IDs of citizens who have voted (prevents double-voting)
  voters: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
