import express from 'express';
import puppeteer from 'puppeteer';
import Invoice from '../../Models/Global/Invoice.js'; 
import Payment from '../../Models/Global/Payment.js'; 

const router = express.Router();

router.get('/:tenantId/:fy', async (req, res) => {
  console.log(`\n======================================================`);
  console.log(`✅ PDF Route Hit for Ledger: Tenant ${req.params.tenantId} | FY ${req.params.fy}`);
  console.log(`🌐 Full Incoming Request URL: ${req.originalUrl}`);
  
  let browser;

  try {
    const { tenantId, fy } = req.params;
    const { month, startMonth, endMonth } = req.query; 

    console.log(`🔍 Querying Database for Invoices & Payments...`);

    let invoiceQuery = { tenant: tenantId };
    
    if (startMonth && endMonth) {
      // 🟢 CUSTOM RANGE: e.g. Feb to April
      invoiceQuery.billingMonth = { $gte: startMonth, $lte: endMonth };
    } else if (month && month !== 'All') {
      // 🟢 SPECIFIC MONTH
      invoiceQuery.billingMonth = month;
    } else {
      // 🟢 FINANCIAL YEAR
      invoiceQuery.financialYear = fy;
    }

    const invoices = await Invoice.find(invoiceQuery)
      .populate('tenant')
      .populate({ path: 'property', populate: { path: 'ownedby' } });
      
    const invoiceIds = invoices.map(inv => inv._id);
    const payments = await Payment.find({ invoice: { $in: invoiceIds } });

    console.log(`📊 Found ${invoices.length} Invoices and ${payments.length} Payments.`);

    if (invoices.length === 0 && payments.length === 0) {
      console.log(`❌ WARNING: No billing history found for this selected period.`);
      return res.status(404).send('No billing history found for this selected period.');
    }

    const tenant = invoices[0]?.tenant; 
    const prop = invoices[0]?.property;

    let timeline = [];

    invoices.forEach(inv => {
      timeline.push({
        date: inv.invoiceDate,
        particulars: `${inv.billType} Bill for ${inv.billingMonth}`,
        ref: inv.invoiceNo,
        debit: inv.totalAmount,
        credit: 0
      });
    });

    payments.forEach(pay => {
      timeline.push({
        date: pay.paymentDate,
        particulars: `Payment Received (${pay.paymentMethod})`,
        ref: pay.transactionId || 'N/A',
        debit: 0,
        credit: pay.amount
      });
    });

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 🟢 TALLY-STYLE RUNNING CALCULATIONS
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const entriesHtml = timeline.map(entry => {
      runningBalance += (entry.debit - entry.credit);
      totalDebit += entry.debit;
      totalCredit += entry.credit;

      const isCredit = runningBalance < 0;
      const displayBalance = Math.abs(runningBalance).toFixed(2);
      const balanceSuffix = runningBalance === 0 ? '' : (isCredit ? ' Cr' : ' Dr');

      return `
        <tr>
          <td class="text-center">${new Date(entry.date).toLocaleDateString('en-GB')}</td>
          <td>
            <div class="bold">${entry.particulars}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Ref: ${entry.ref}</div>
          </td>
          <td class="text-right">${entry.debit > 0 ? entry.debit.toFixed(2) : '-'}</td>
          <td class="text-right" style="color: #22c55e; font-weight: bold;">${entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</td>
          <td class="text-right bold">${displayBalance}${balanceSuffix}</td>
        </tr>
      `;
    }).join('');

    const finalBalance = Math.abs(runningBalance).toFixed(2);
    const isFinalCredit = runningBalance < 0;
    const finalBalanceSuffix = runningBalance === 0 ? '' : (isFinalCredit ? ' Cr' : ' Dr');
    const finalBalanceColor = runningBalance > 0 ? '#dc2626' : '#22c55e'; 

    // 🟢 TOTALS FOOTER ROW (TALLY FORMAT)
    const totalsHtml = `
      <tr style="border-top: 2px solid #0F172A; background-color: #f1f5f9;">
        <td colspan="2" class="text-right bold" style="font-size: 12px; padding-right: 15px; text-transform: uppercase;">Closing Totals:</td>
        <td class="text-right bold" style="font-size: 12px;">₹ ${totalDebit.toFixed(2)}</td>
        <td class="text-right bold" style="font-size: 12px; color: #22c55e;">₹ ${totalCredit.toFixed(2)}</td>
        <td class="text-right bold" style="font-size: 12px; color: ${finalBalanceColor};">₹ ${finalBalance}${finalBalanceSuffix}</td>
      </tr>
    `;

    let headerSubtitle = `Financial Year: ${fy}`;
    if (startMonth && endMonth) headerSubtitle = `Period: ${startMonth} to ${endMonth}`;
    else if (month && month !== 'All') headerSubtitle = `Billing Month: ${month}`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; font-size: 12px; color: #0F172A; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h2 { font-size: 24px; color: #0F172A; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
          .header h3 { font-size: 14px; color: #64748b; margin: 0; font-weight: normal; }
          .divider { border-top: 2px solid #0F172A; margin: 20px 0; width: 100%; }
          .info-card { display: flex; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
          .info-block { flex: 1; padding: 15px 20px; border-right: 1px solid #e2e8f0; }
          .info-block:last-child { border-right: none; }
          .info-block h4 { margin: 0 0 5px 0; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
          .info-block p { margin: 0; font-size: 14px; color: #0F172A; font-weight: bold; }
          .info-block .sub-text { font-size: 11px; font-weight: normal; color: #64748b; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px 10px; }
          th { background-color: #0F172A; color: white; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .bold { font-weight: bold; } .text-right { text-align: right; } .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>STATEMENT OF ACCOUNT</h2>
          <h3>${headerSubtitle}</h3>
        </div>
        <div class="divider"></div>
        <div class="info-card">
          <div class="info-block">
            <h4>Tenant Details</h4><p>${tenant?.name || 'N/A'}</p><div class="sub-text">PAN: ${tenant?.panNumber || 'N/A'}</div>
          </div>
          <div class="info-block">
            <h4>Property Details</h4><p>${prop?.name || 'N/A'}</p><div class="sub-text">Unit: ${prop?.address?.houseno || ''}, ${prop?.address?.city || ''}</div>
          </div>
          <div class="info-block text-right text-center">
            <h4 style="text-align: right;">Current Outstanding Balance</h4>
            <p style="font-size: 20px; color: ${finalBalanceColor}; text-align: right;">₹ ${finalBalance}</p>
          </div>
        </div>
        <table>
          <tr><th style="width: 12%;">Date</th><th style="width: 40%; text-align: left; padding-left: 15px;">Transaction Details</th><th style="width: 16%; text-align: right;">Debit (Billed) ₹</th><th style="width: 16%; text-align: right;">Credit (Paid) ₹</th><th style="width: 16%; text-align: right;">Balance ₹</th></tr>
          ${entriesHtml}
          ${totalsHtml} </table>
        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8;">
          <p>*** End of Statement ***</p><p>Generated on ${new Date().toLocaleString('en-GB')} • Authorized System Print</p>
        </div>
      </body>
      </html>
    `;

    console.log("🚀 Launching Puppeteer for Ledger...");

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

    console.log("🖨️ Printing Ledger to PDF...");
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true, 
      margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' } 
    });
    
    console.log("✅ Ledger PDF successfully generated!");
    
    res.contentType("application/pdf");
    res.setHeader('Content-Disposition', `inline; filename="Ledger_${tenant?.name?.replace(/\s+/g, '_') || 'Tenant'}.pdf"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error("🔥 PDF Generation Error:", error);
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; color: red;">
        <h2>Oops! Failed to generate Ledger PDF.</h2>
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