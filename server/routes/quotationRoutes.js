const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const generatePDF = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

// Mutex for quotation number generation
const quotationLocks = new Map();

// Create a new quotation and generate PDF
router.post('/quotations', async (req, res) => {
  const quotationData = req.body;
  let lockId = null;

  try {
    console.log('Received quotation data:', quotationData);

    // Validate required fields
    if (!quotationData.customerName || !quotationData.customerAddress || !quotationData.items || !quotationData.items.length) {
      console.error('Validation failed:', { 
        hasCustomerName: !!quotationData.customerName,
        hasCustomerAddress: !!quotationData.customerAddress,
        hasItems: !!quotationData.items,
        itemsLength: quotationData.items?.length
      });
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: 'Customer name, address, and at least one item are required'
      });
    }

    // Validate items
    for (const item of quotationData.items) {
      if (!item.description || !item.quantity || !item.rate) {
        console.error('Item validation failed:', item);
        return res.status(400).json({
          message: 'Invalid item data',
          details: 'Each item must have a description, quantity, and rate'
        });
      }
    }

    // Generate lock ID for this request
    lockId = `${Date.now()}-${Math.random()}`;
    
    // Wait for any existing locks to be released
    while (quotationLocks.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Acquire lock
    quotationLocks.set(lockId, true);

    // Generate a unique quotation number
    let attempts = 0;
    const maxAttempts = 5;
    let quotationNo = quotationData.quotationNo;
    let existingQuotation;

    do {
      console.log('Checking for existing quotation:', quotationNo);
      existingQuotation = await Quotation.findOne({ quotationNo });
      
      if (existingQuotation && attempts < maxAttempts) {
        console.log('Found existing quotation, generating new number');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const randomNum = String(Math.floor(Math.random() * 900) + 100);
        quotationNo = `GM-${year}${month}${day}-${randomNum}`;
        quotationData.quotationNo = quotationNo;
        attempts++;
      }
    } while (existingQuotation && attempts < maxAttempts);

    if (existingQuotation) {
      return res.status(409).json({
        message: 'Failed to generate unique quotation number after multiple attempts',
        details: 'Please try again'
      });
    }

    // Generate PDF
    const pdfPath = await generatePDF(quotationData);
    
    // Save quotation to database
    const quotation = new Quotation(quotationData);
    await quotation.save();
    console.log('Quotation saved successfully');

    // Return the PDF download URL
    const pdfFileName = path.basename(pdfPath);
    res.json({
      message: 'Quotation created successfully',
      quotationId: quotation._id,
      pdfUrl: `/downloads/${pdfFileName}`,
      quotationNo: quotationData.quotationNo
    });

  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ message: 'Error creating quotation', error: error.message });
  } finally {
    if (lockId) {
      quotationLocks.delete(lockId);
    }
  }
});

// Get all quotations
router.get('/quotations', async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ date: -1 });
    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Error fetching quotations', error: error.message });
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
    console.error('Error fetching quotation:', error);
    res.status(500).json({ message: 'Failed to fetch quotation', error: error.message });
  }
});

// Download PDF endpoint
router.get('/quotations/:quotationNo/download', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ quotationNo: req.params.quotationNo });
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const pdfPath = path.join(__dirname, '../downloads', `${quotation.quotationNo}.pdf`);
    
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      // Regenerate PDF if it doesn't exist
      await generatePDF(quotation);
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Quotation-${quotation.quotationNo}.pdf`);
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ message: 'Error downloading PDF', error: error.message });
  }
});

module.exports = router;