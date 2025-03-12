const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  rate: {
    type: Number,
    required: true
  }
});

const QuotationSchema = new mongoose.Schema({
  quotationNo: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerName: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    required: true
  },
  bikeRegNo: {
    type: String
  },
  items: [ItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  remarks: {
    type: String,
    default: 'Payment should be made within 7 days of invoice date.'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quotation', QuotationSchema);