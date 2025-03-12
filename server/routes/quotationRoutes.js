const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const generatePDF = require('../utils/pdfGenerator');

// Create a new quotation and generate PDF
router.post('/quotations', async (req, res) => {
  try {
    const quotationData = req.body;
    
    // Save to database
    const newQuotation = new Quotation(quotationData);
    await newQuotation.save();
    
    // Generate PDF
    const pdfBuffer = await generatePDF(quotationData);
    
    // Send PDF as response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Quotation-${quotationData.quotationNo}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating quotation:', error);
    res.status(500).json({ message: 'Failed to generate quotation' });
  }
});

// Get all quotations
router.get('/quotations', async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quotations' });
  }
});

// Get quotation by ID
router.get('/quotations/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quotation' });
  }
});

module.exports = router;