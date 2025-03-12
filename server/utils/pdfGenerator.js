const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const generatePDF = async (quotationData) => {
  try {
    // Read the template
    const templatePath = path.join(__dirname, '../templates/quotation-template.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateHtml);
    
    // Format amounts
    const formattedItems = quotationData.items.map(item => {
      const amount = parseFloat(item.quantity) * parseFloat(item.rate);
      return {
        ...item,
        formattedRate: parseFloat(item.rate).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        formattedAmount: amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      };
    });
    
    const totalAmount = parseFloat(quotationData.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Format date
    const dateObj = new Date(quotationData.date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const year = dateObj.getFullYear();
    const formattedDate = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    
    // Prepare data for the template
    const data = {
      ...quotationData,
      items: formattedItems,
      formattedTotalAmount: totalAmount,
      formattedDate: formattedDate
    };
    
    // Render the template with the data
    const html = template(data);
    
    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    // Close the browser
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Helper function to get ordinal suffix for day
function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

module.exports = generatePDF;