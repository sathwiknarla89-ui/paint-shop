const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a customer name'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    bills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
      },
    ],
    totalPurchases: {
      type: Number,
      default: 0,
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to make customer searches fast
CustomerSchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);
