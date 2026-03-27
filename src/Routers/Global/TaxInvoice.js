import express from 'express';
import puppeteer from 'puppeteer';
import Invoice from '../../Models/Global/Invoice.js';

const router = express.Router();

function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() + ' Only';
}

router.get('/:invoiceId', async (req, res) => {
  console.log(`\n======================================================`);
  console.log(`✅ PDF Route Hit for Tax Invoice: ${req.params.invoiceId}`);
  console.log(`🌐 Full Incoming Request URL: ${req.originalUrl}`);
  
  let browser;
  
  try {
    console.log(`🔍 Querying Database for Invoice Data...`);
    
    // 1. Try to find by direct Invoice ID first
    let invoice = await Invoice.findById(req.params.invoiceId)
      .populate('tenant')
      .populate({ path: 'property', populate: { path: 'ownedby' } });

    // 2. SMART FALLBACK: If the UI passed a Tenant ID with month/year params
    if (!invoice && req.query.month && req.query.year) {
      const monthStr = String(req.query.month).padStart(2, '0');
      const billingMonth = `${req.query.year}-${monthStr}`; 
      
      invoice = await Invoice.findOne({ 
        tenant: req.params.invoiceId, 
        billingMonth: billingMonth 
      })
      .populate('tenant')
      .populate({ path: 'property', populate: { path: 'ownedby' } });
    }

    if (!invoice) {
      console.log(`❌ WARNING: Invoice not found in database for this ID or month.`);
      return res.status(404).send('Invoice not found in database for this month.');
    }

    console.log(`📄 Found Invoice: ${invoice.invoiceNo} | Tenant: ${invoice.tenant?.name}`);

    const tenant = invoice.tenant;
    const prop = invoice.property;
    
    const ownerData = prop.ownedby || prop.brokerOwnerDetails || {};
    const ownerName = ownerData.companyName || ownerData.name || ownerData.ownerName || 'Authorized Owner';
    const ownerPhone = ownerData.phone || ownerData.ownerPhone || 'N/A';
    const ownerPan = ownerData.pancard || 'N/A';

    let particularsDesc = "";
    let qtyStr = "-";
    let rateStr = "-";

    if (invoice.billType === 'ELECTRICITY') {
      particularsDesc = `Electricity Consumption Charges for the month of ${invoice.billingMonth}.`;
      qtyStr = `${invoice.electricDetails?.units || 0} Units`;
      rateStr = `₹${invoice.electricDetails?.rate || 0} / unit`;
    } else if (invoice.billType === 'MAINTENANCE') {
      particularsDesc = `Common Area Maintenance (CAM) Charges for unit at ${prop.name} for the month of ${invoice.billingMonth}.`;
      qtyStr = prop.superbuilderarea || prop.carpetarea || 'Flat Rate';
    } else {
      particularsDesc = `Monthly Rent for unit at ${prop.name} for the month of ${invoice.billingMonth}.`;
      qtyStr = prop.carpetarea || 'Flat Rate';
    }

    const isGstApplied = invoice.cgst > 0 || invoice.sgst > 0;

    const actualDue = invoice.amountDue != null ? invoice.amountDue : invoice.totalAmount;
    const actualPaid = invoice.amountPaid != null ? invoice.amountPaid : 0;
    
    let statusColor = "red";
    if (invoice.status === "PAID") statusColor = "green";
    if (invoice.status === "PARTIAL") statusColor = "darkorange";

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111; font-size: 12px; }
          .header-table { width: 100%; border-bottom: 2px solid #0F172A; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #0F172A; text-transform: uppercase; text-align: right; }
          table.main-table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-top: 20px; }
          .main-table th { background-color: #f8f9fa; color: #0F172A; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #ddd; }
          .main-table td { border: 1px solid #ddd; padding: 10px; vertical-align: top; }
          .bold { font-weight: bold; } .text-right { text-align: right; } .text-center { text-align: center; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 10px; color: #555; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 50%">
              <div style="font-size: 18px;" class="bold">${ownerName}</div>
              <div>Phone: ${ownerPhone}</div>
              <div>PAN: ${ownerPan}</div>
            </td>
            <td style="width: 50%" class="text-right">
              <div class="title">TAX INVOICE</div>
              <div class="bold" style="color: #64748b; font-size: 14px;">${invoice.billType} BILL</div>
            </td>
          </tr>
        </table>

        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="width: 50%; padding-right: 20px;">
              <div class="bold" style="background-color: #f8f9fa; padding: 5px;">BILLED TO:</div>
              <div class="bold" style="font-size: 14px; margin-top: 5px;">${tenant.name}</div>
              <div>${prop.address?.houseno || ''}, ${prop.address?.street || ''}</div>
              <div>${prop.address?.city || ''}, ${prop.address?.state || ''} - ${prop.address?.pincode || ''}</div>
              <div style="margin-top: 5px;"><span class="bold">PAN:</span> ${tenant.panNumber || 'N/A'}</div>
            </td>
            <td style="width: 50%;">
              <div class="bold" style="background-color: #f8f9fa; padding: 5px;">INVOICE DETAILS:</div>
              <table style="width: 100%; margin-top: 5px;">
                <tr><td class="bold">Invoice No:</td><td class="text-right">${invoice.invoiceNo}</td></tr>
                <tr><td class="bold">Invoice Date:</td><td class="text-right">${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</td></tr>
                <tr><td class="bold">Billing Month:</td><td class="text-right">${invoice.billingMonth}</td></tr>
                <tr><td class="bold">Status:</td><td class="text-right" style="color: ${statusColor}; font-weight: bold;">${invoice.status}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <table class="main-table">
          <tr>
            <th style="width: 50%">Description of Service</th>
            <th style="width: 15%" class="text-center">Qty / Area</th>
            <th style="width: 15%" class="text-center">Rate</th>
            <th style="width: 20%" class="text-right">Amount (INR)</th>
          </tr>
          <tr>
            <td style="min-height: 120px; height: 120px;">${particularsDesc}</td>
            <td class="text-center">${qtyStr}</td>
            <td class="text-center">${rateStr}</td>
            <td class="text-right">${invoice.baseAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" class="bold text-right">TAXABLE VALUE:</td>
            <td class="bold text-right">${invoice.baseAmount.toFixed(2)}</td>
          </tr>
          ${isGstApplied ? `
          <tr><td colspan="3" class="text-right">Add: CGST</td><td class="text-right">${invoice.cgst.toFixed(2)}</td></tr>
          <tr><td colspan="3" class="text-right">Add: SGST</td><td class="text-right">${invoice.sgst.toFixed(2)}</td></tr>
          ` : ''}
          <tr>
            <td colspan="3" class="bold text-right" style="font-size: 14px;">GRAND TOTAL:</td>
            <td class="bold text-right" style="font-size: 14px; background-color: #f8f9fa;">₹ ${invoice.totalAmount.toFixed(2)}</td>
          </tr>
          
          ${actualPaid > 0 ? `
          <tr>
            <td colspan="3" class="bold text-right" style="color: green;">LESS: AMOUNT PAID:</td>
            <td class="bold text-right" style="color: green;">- ₹ ${actualPaid.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="3" class="bold text-right" style="font-size: 15px; color: ${actualDue > 0 ? '#dc2626' : 'green'};">BALANCE DUE:</td>
            <td class="bold text-right" style="font-size: 15px; color: ${actualDue > 0 ? '#dc2626' : 'green'}; background-color: ${actualDue > 0 ? '#fef2f2' : '#f0fdf4'};">₹ ${actualDue.toFixed(2)}</td>
          </tr>

          <tr>
            <td colspan="4" class="text-center" style="font-style: italic;">Amount in words: Rupees ${numberToWords(Math.round(invoice.totalAmount))}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    console.log("🚀 Launching Puppeteer for Tax Invoice...");

    // 🟢 SMART OS DETECTION (From PropertyPDF)
    const isWindows = process.platform === 'win32';
    const puppeteerArgs = [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=IsolateOrigins,site-per-process'
    ];

    if (!isWindows) {
      puppeteerArgs.push('--single-process');
      puppeteerArgs.push('--no-zygote');
    }

    browser = await puppeteer.launch({ 
      headless: true, 
      userDataDir: isWindows ? './.cache/puppeteer_tmp' : '/tmp/puppeteer_tmp', 
      args: puppeteerArgs 
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.emulateMediaType('print');

    console.log("🖨️ Printing Tax Invoice to PDF...");
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true, 
      margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' } 
    });
    
    console.log("✅ Tax Invoice PDF successfully generated!");
    
    res.contentType("application/pdf");
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNo.replace(/\//g, '-')}.pdf"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error("🔥 PDF Generation Error:", error);
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; color: red;">
        <h2>Oops! Failed to generate Invoice PDF.</h2>
        <p>Error: ${error.message}</p>
        <p>Check the backend terminal logs for more details.</p>
      </div>
    `);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🧹 Browser closed and memory released.");
    }
  }
});

export default router;