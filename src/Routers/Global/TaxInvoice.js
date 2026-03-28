import express from 'express';
import puppeteer from 'puppeteer';
import axios from 'axios';
import Invoice from '../../Models/Global/Invoice.js';

const router = express.Router();

// 🟢 Improved Number to Words (Handles Indian Rupees & Paisa)
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
  return str.trim();
}

function convertAmountToWords(amount) {
  const [rupees, paisa] = Number(amount).toFixed(2).split('.');
  let str = numberToWords(Number(rupees));
  if (str !== '') str = 'Rupees ' + str;
  if (Number(paisa) > 0) {
      str += (str ? ' and Paisa ' : 'Paisa ') + numberToWords(Number(paisa));
  }
  return `(${str} Only)`.replace(/  +/g, ' '); 
}

router.get('/:invoiceId', async (req, res) => {
  console.log(`\n======================================================`);
  console.log(`✅ PDF Route Hit for Tax Invoice: ${req.params.invoiceId}`);
  console.log(`🌐 Full Incoming Request URL: ${req.originalUrl}`);
  
  let browser;
  
  try {
    console.log(`🔍 Querying Database for Invoice Data...`);
    
    let invoice = await Invoice.findById(req.params.invoiceId)
      .populate('tenant')
      .populate({ path: 'property', populate: { path: 'ownedby' } });

    if (!invoice && req.query.month && req.query.year) {
      const monthStr = String(req.query.month).padStart(2, '0');
      const billingMonth = `${req.query.year}-${monthStr}`; 
      invoice = await Invoice.findOne({ tenant: req.params.invoiceId, billingMonth: billingMonth })
      .populate('tenant').populate({ path: 'property', populate: { path: 'ownedby' } });
    }

    if (!invoice) return res.status(404).send('Invoice not found in database.');
    console.log(`📄 Found Invoice: ${invoice.invoiceNo} | Tenant: ${invoice.tenant?.name}`);

    const tenant = invoice.tenant;
    const prop = invoice.property;
    
    const ownerData = prop.ownedby || prop.brokerOwnerDetails || {};
    
    // 🟢 strictly uses Owner Name
    const ownerName = ownerData.companyName || ownerData.name || ownerData.ownerName || 'Authorized Owner';
    const ownerPhone = ownerData.phone || ownerData.ownerPhone || '';
    const ownerEmail = ownerData.email || '';
    const ownerPan = ownerData.panno || ownerData.pancard || 'N/A';
    const ownerGst = ownerData.gst || 'N/A';
    const ownerAddress = ownerData.address || '';
    
    // 🟢 Fetch Signature Securely
    let signatureBase64 = '';
    if (ownerData.digitalSignature) {
      try {
        console.log("📝 Fetching Digital Signature image...");
        const sigRes = await axios.get(ownerData.digitalSignature, { responseType: 'arraybuffer', timeout: 10000 });
        const contentType = sigRes.headers['content-type'];
        signatureBase64 = `data:${contentType};base64,${Buffer.from(sigRes.data, 'binary').toString('base64')}`;
      } catch (e) {
        console.error("⚠️ Could not fetch signature image", e.message);
      }
    }

    const isCommercial = ['Commercial', 'Office', 'Shop'].includes(prop.type);
    
    // 🟢 Build Full Address String for the Unit No.
    const fullAddressArray = [
      prop.address?.houseno,
      prop.address?.street,
      prop.address?.city,
      prop.address?.state,
      prop.address?.pincode
    ].filter(Boolean);
    const unitAddress = fullAddressArray.join(', ');

    const placeOfSupply = prop.address?.state?.toUpperCase() || "WEST BENGAL";
    const floorText = isCommercial ? "" : "NA";

    // 🟢 HSN Logic
    let hsnCode = "997211"; 
    if (invoice.billType === 'ELECTRICITY') hsnCode = "2716";
    else if (isCommercial) hsnCode = "997212";

    // 🟢 Particulars Logic (Includes Property Name Explicitly)
    let particularsDesc = "";
    let qtyStr = "";
    let rateStr = "";

    if (invoice.billType === 'ELECTRICITY') {
      particularsDesc = `Being <b>Electricity Charges</b> for using of Unit No. ${unitAddress} of <b>${prop.name}</b> for the month of <b>${invoice.billingMonth}</b>, as per actuals incurred.`;
      qtyStr = invoice.electricDetails?.units ? `${invoice.electricDetails.units}` : "-";
      rateStr = invoice.electricDetails?.rate ? `${invoice.electricDetails.rate}` : "-";
    } else {
      qtyStr = prop.superbuilderarea || prop.carpetarea || '-';
      const parsedArea = parseFloat(qtyStr);
      rateStr = (parsedArea && parsedArea > 0) ? (invoice.baseAmount / parsedArea).toFixed(2) : "-";

      if (invoice.billType === 'MAINTENANCE') {
        particularsDesc = `Being <b>Maintenance Charges</b> against common building facilities for using of Unit No. ${unitAddress} of <b>${prop.name}</b> for the month of <b>${invoice.billingMonth}</b>, as per actuals incurred.`;
      } else {
        particularsDesc = `Being <b>Rent Charges</b> for using of Unit No. ${unitAddress} of <b>${prop.name}</b> for the month of <b>${invoice.billingMonth}</b>.`;
      }
    }

    // 🟢 Math & GST Labels
    const isGstApplied = invoice.cgst > 0 || invoice.sgst > 0;
    const cgstRate = isGstApplied ? ((invoice.cgst / invoice.baseAmount) * 100).toFixed(1) : 0;
    const sgstRate = isGstApplied ? ((invoice.sgst / invoice.baseAmount) * 100).toFixed(1) : 0;

    const actualDue = invoice.amountDue != null ? invoice.amountDue : invoice.totalAmount;
    const actualPaid = invoice.amountPaid != null ? invoice.amountPaid : 0;

    const invoiceDateStr = new Date(invoice.invoiceDate).toLocaleDateString('en-GB');
    const timestampStr = new Date(invoice.invoiceDate).toLocaleString('en-GB');

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; margin: 0; }
          h2 { text-align: center; margin: 0 0 15px 0; font-size: 18px; font-weight: bold; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: -1px; }
          td, th { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
          .bold { font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .no-border-bottom { border-bottom: none; }
          .no-border-top { border-top: none; }
          
          .main-table-body td { height: 250px; } 
          
          .footer-section { padding: 10px; }
          .signature-box { max-height: 50px; margin: 5px 0; display: block; }
          .red-text { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>TAX INVOICE</h2>
        
        <table>
          <tr>
            <td style="width: 50%;">
              <span class="bold" style="font-size: 14px;">${ownerName}</span><br>
              ${ownerAddress.replace(/\n/g, '<br>')}<br>
              <span class="bold">GSTIN: ${ownerGst}</span><br>
              Email: ${ownerEmail}
            </td>
            <td style="width: 50%;">
              Bill to:<br>
              <span class="bold" style="font-size: 14px;">${tenant.name}</span><br>
              ${tenant.permanentAddress.replace(/\n/g, '<br>')}<br>
              <span class="bold">GSTIN: ${tenant.gst || 'N/A'}</span><br>
              Email: ${tenant.email || 'N/A'}
            </td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width: 50%;">Invoice No: <b>${invoice.invoiceNo}</b></td>
            <td style="width: 25%;">Inv. Date: <b>${invoiceDateStr}</b></td>
            <td style="width: 25%;">Place of Supply<br><b style="text-transform: uppercase;">${placeOfSupply}</b></td>
          </tr>
          <tr>
            <td style="width: 50%;">Unit No.: <b>${unitAddress}</b></td>
            <td style="width: 25%;">Floor: <b>${floorText}</b></td>
            <td style="width: 25%;">HSN Code: <b>${hsnCode}</b></td>
          </tr>
        </table>

        <table>
          <tr>
            <th style="width: 50%; text-align: center;">Particulars</th>
            <th style="width: 20%; text-align: center;">Chargeable Area<br>(Sq. ft)</th>
            <th style="width: 15%; text-align: center;">Rate</th>
            <th style="width: 20%; text-align: center;">Amount (Rs.)</th>
          </tr>
          <tr class="main-table-body">
            <td>${particularsDesc}</td>
            <td class="text-right">${qtyStr}</td>
            <td class="text-right">${rateStr}</td>
            <td class="text-right">${invoice.baseAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" class="bold text-right">AMOUNT:</td>
            <td class="bold text-right">${invoice.baseAmount.toFixed(2)}</td>
          </tr>
          ${isGstApplied ? `
          <tr>
            <td colspan="3" class="bold text-right">CGST @ ${cgstRate}%</td>
            <td class="bold text-right">${invoice.cgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" class="bold text-right">SGST @ ${sgstRate}%</td>
            <td class="bold text-right">${invoice.sgst.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="3" class="bold text-right" style="font-size: 14px;">TOTAL NET AMOUNT:</td>
            <td class="bold text-right" style="font-size: 14px;">${invoice.totalAmount.toFixed(2)}</td>
          </tr>
          
          <tr>
            <td colspan="3" class="bold text-right" style="color: #16a34a;">LESS: AMOUNT PAID:</td>
            <td class="bold text-right" style="color: #16a34a;">- ${actualPaid.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" class="bold text-right" style="font-size: 14px; color: ${actualDue > 0 ? '#dc2626' : '#16a34a'};">BALANCE DUE:</td>
            <td class="bold text-right" style="font-size: 14px; color: ${actualDue > 0 ? '#dc2626' : '#16a34a'};">
              ${actualDue.toFixed(2)}
            </td>
          </tr>

          <tr>
            <td colspan="4" class="text-center" style="font-style: italic;">
              ${convertAmountToWords(invoice.totalAmount)}
            </td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width: 50%; vertical-align: top;">
              For <span class="bold">${ownerName}</span><br>
              ${signatureBase64 ? `<img src="${signatureBase64}" class="signature-box"/>` : '<br><br><br>'}
              <span class="bold" style="font-size: 16px;">${ownerName}</span><br>
              <span style="font-size: 10px; color: #555;">
                Digitally signed by ${ownerName}<br>
                Date: ${timestampStr}
              </span>
            </td>
            <td style="width: 50%; vertical-align: top;">
              Our PAN: <span class="bold">${ownerPan}</span><br><br>
              Our <span class="red-text">NEW Bank</span> Account Details:<br>
              <span class="bold">${ownerData.bankDetails?.accountName || 'N/A'}</span><br>
              ${ownerData.bankDetails?.bankName || 'N/A'}<br>
              <span class="bold">A/c No: ${ownerData.bankDetails?.accountNumber || 'N/A'} IFSC: ${ownerData.bankDetails?.ifscCode || 'N/A'}</span>
            </td>
          </tr>
        </table>

      </body>
      </html>
    `;

    console.log("🚀 Launching Puppeteer for Tax Invoice...");

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