const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Create a single browser instance that can be reused
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ]
    });
  }
  return browserInstance;
}

const generatePDF = async (quotationData) => {
  let page = null;
  const tempDir = path.join(os.tmpdir(), `puppeteer-${crypto.randomBytes(6).toString('hex')}`);
  
  try {
    // Read and validate template
    const templatePath = path.join(__dirname, '../templates/quotation-template.html');
    console.log('Reading template from:', templatePath);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }
    
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    console.log('Template loaded successfully');
    
    // Compile template
    const template = handlebars.compile(templateHtml);
    console.log('Template compiled successfully');
    
    // Format data
    console.log('Formatting items:', quotationData.items);
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
    
    // Prepare data
    const data = {
      ...quotationData,
      items: formattedItems,
      formattedTotalAmount: totalAmount,
      formattedDate: formattedDate
    };
    
    // Render template
    console.log('Rendering template');
    const html = template(data);
    
    // Get browser instance
    console.log('Getting browser instance');
    const browser = await getBrowser();
    
    // Create new page
    console.log('Creating new page');
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);
    
    // Set content
    console.log('Setting page content');
    await page.setContent(html, { 
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });
    console.log('Page content set successfully');
    
    // Generate PDF
    console.log('Generating PDF');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      timeout: 30000,
      preferCSSPageSize: true
    });
    console.log('PDF generated successfully');
    
    // Close only the page, not the browser
    if (page) {
      await page.close();
      console.log('Page closed successfully');
    }
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error in PDF generation:', error);
    console.error('Error Stack:', error.stack);
    
    // Clean up on error
    if (page) {
      try {
        await page.close();
        console.log('Page closed after error');
      } catch (closeError) {
        console.error('Error closing page:', closeError);
      }
    }
    
    throw error;
  }
};

// Helper function for date ordinal
function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Cleanup function to be called when server shuts down
async function cleanup() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      browserInstance = null;
      console.log('Browser instance closed during cleanup');
    } catch (error) {
      console.error('Error closing browser during cleanup:', error);
    }
  }
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = generatePDF;
module.exports = generatePDF;