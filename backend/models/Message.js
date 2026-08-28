const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'ServiceRequest',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['User'], // Admins and Users are both in the 'User' collection
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
