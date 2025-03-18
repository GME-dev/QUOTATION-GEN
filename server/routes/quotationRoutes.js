const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const generatePDF = require('../utils/pdfGenerator');

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

    // Save to database
    console.log('Saving quotation to database');
    const newQuotation = new Quotation(quotationData);
    await newQuotation.save();
    console.log('Quotation saved successfully');

    try {
      // Generate PDF
      console.log('Generating PDF');
      const pdfBuffer = await generatePDF(quotationData);
      console.log('PDF generated successfully');

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Quotation-${quotationNo}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Send the PDF buffer
      return res.send(pdfBuffer);
    } catch (pdfError) {
      console.error('PDF Generation Error:', pdfError);
      console.error('Error Stack:', pdfError.stack);
      
      // If PDF generation fails, still return success for the quotation creation
      return res.status(200).json({ 
        message: 'Quotation saved successfully but PDF generation failed',
        quotationNo: quotationNo,
        error: pdfError.message,
        details: 'Please try downloading the PDF again from the quotations list'
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    console.error('Error Stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to generate quotation',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Release lock
    if (lockId) {
      quotationLocks.delete(lockId);
    }
  }
});

// Get all quotations
router.get('/quotations', async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
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

module.exports = router;