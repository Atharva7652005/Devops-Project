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
    requestedMaximumCharge: {
      type: Number,
      required: true,
      default: 0,
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
      ref: 'User',
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
    statusLog: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now }
      }
    ],
    quotedCost: {
      type: Number,
    },
    quotationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Declined', 'Not Required'],
      default: 'Not Required',
    },
    warrantyEndDate: {
      type: Date,
    },
    estimatedArrival: {
      type: String, // e.g. "14:30" or "Between 2 PM and 4 PM"
    },
    technicianResponses: [
      {
        technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Confirmed', 'Rejected'] },
        basePrice: { type: Number },
        date: { type: Date, default: Date.now }
      }
    ],
  },
  {
    timestamps: true,
  }
);

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports = ServiceRequest;
