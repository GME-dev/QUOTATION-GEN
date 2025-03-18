const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Create a single browser instance that can be reused
let browserInstance = null;

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: process.env.NODE_ENV === 'production' ? '/usr/bin/google-chrome' : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--allow-running-insecure-content',
        '--disable-web-security'
      ]
    });
  }
  return browserInstance;
}

const generatePDF = async (quotationData) => {
  let page = null;
  const tempDir = path.join(os.tmpdir(), `puppeteer-${crypto.randomBytes(6).toString('hex')}`);
  const outputPath = path.join(downloadsDir, `${quotationData.quotationNo}.pdf`);
  
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
    
    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    // Set content with proper wait conditions
    console.log('Setting page content');
    await page.setContent(html, { 
      waitUntil: ['load', 'domcontentloaded', 'networkidle0']
    });
    
    // Wait for images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });

    // Add extra wait time for images
    await page.waitForTimeout(1000);

    // Generate PDF
    console.log('Generating PDF');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    // Set proper file permissions
    fs.chmodSync(outputPath, 0o644);

    console.log('PDF generated successfully');
    return outputPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (page) {
      await page.close();
      console.log('Page closed successfully');
    }
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Error cleaning up temp directory:', error);
      }
    }
  }
};

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

async function cleanup() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      browserInstance = null;
      console.log('Browser instance closed successfully');
    } catch (error) {
      console.error('Error closing browser instance:', error);
    }
  }
}

// Cleanup on process exit
process.on('exit', cleanup);
process.on('SIGINT', async () => {
  await cleanup();
  process.exit();
});
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit();
});

module.exports = generatePDF;