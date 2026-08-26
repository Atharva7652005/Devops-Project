const mongoose = require('mongoose');

const serviceRequestSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    category: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    assignedTechnician: {
      type: String,
      default: 'Unassigned',
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician',
      default: null,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    adminNotes: [
      {
        note: { type: String, required: true },
        adminUser: { type: String, required: true },
        date: { type: Date, default: Date.now },
      }
    ],
    attachments: {
      type: [String],
      default: [],
    },
    rescheduleRequests: [
      {
        requestedDate: { type: Date, required: true },
        reason: { type: String },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        dateRequested: { type: Date, default: Date.now }
      }
    ],
  },
  {
    timestamps: true,
  }
);

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports = ServiceRequest;
