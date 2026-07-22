const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Please add a brand'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true,
    },
    colour: {
      type: String,
      required: [true, 'Please add a colour'],
      trim: true,
    },
    size: {
      type: String,
      required: [true, 'Please add a size (e.g. 1L, 4L, 10L, 20L)'],
      trim: true,
    },
    buyingPrice: {
      type: Number,
      required: [true, 'Please add a buying price'],
      min: [0, 'Buying price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add a selling price'],
      min: [0, 'Selling price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    supplier: {
      type: String,
      trim: true,
      default: 'General Supplier',
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search functionality across multiple fields
ProductSchema.index({ name: 'text', brand: 'text', colour: 'text', category: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
