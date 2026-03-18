import express from 'express';
import puppeteer from 'puppeteer';
import axios from 'axios';
import Property from '../../Models/Global/Property.js'; 

const router = express.Router();

router.get('/:id', async (req, res) => {
  console.log(`\n✅ PDF Route successfully hit for Property ID: ${req.params.id}`);
  
  try {
    // 1. Fetch Property with ALL related user data
    const property = await Property.findById(req.params.id)
      .populate('ownedby')
      .populate('addedByBroker'); // In case a broker created it

    if (!property) {
      return res.status(404).send('Property not found');
    }

    console.log("🖼️ Fetching Images and converting to Base64...");
    
    // 2. Fetch up to 6 images concurrently and convert to Base64
    // (We limit to 6 so the PDF doesn't become too massive/slow)
    const imageUrls = property.img ? property.img.slice(0, 6) : [];
    
    const base64Images = await Promise.all(
      imageUrls.map(async (imgUrl) => {
        try {
          const imageResponse = await axios.get(imgUrl, { responseType: 'arraybuffer' });
          const imageBase64 = Buffer.from(imageResponse.data, 'binary').toString('base64');
          const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
          return `data:${contentType};base64,${imageBase64}`;
        } catch (imgError) {
          console.error(`⚠️ Could not load image ${imgUrl}:`, imgError.message);
          return null;
        }
      })
    );

    // Filter out any images that failed to load
    const validImages = base64Images.filter(img => img !== null);

    console.log("📄 Generating HTML Template...");
    
    // 3. Determine Contact Person
    const contactName = property.addedByBroker?.name || property.ownedby?.name || property.brokerOwnerDetails?.ownerName || 'Authorized Broker';
    const contactPhone = property.addedByBroker?.phone || property.ownedby?.phone || property.brokerOwnerDetails?.ownerPhone || 'Reply to this WhatsApp message';

    // 4. Build the HTML Template with ALL Details
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0F172A; padding: 30px 40px; margin: 0; }
          .header { text-align: center; border-bottom: 3px solid #FACC15; padding-bottom: 20px; margin-bottom: 25px; }
          h1 { margin: 0; font-size: 30px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; }
          h3 { color: #64748b; margin: 8px 0 0 0; font-weight: normal; font-size: 16px; }
          .badge { background-color: #FACC15; color: #0F172A; padding: 5px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block; margin-top: 15px; }
          
          /* Dynamic Image Gallery Grid */
          .image-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
          .image-grid img { width: 100%; height: 200px; object-fit: cover; border-radius: 10px; border: 1px solid #e2e8f0; }
          /* Make the first image span full width if it's the only one, or if there are 3 images */
          .image-grid img:first-child:nth-last-child(1) { grid-column: span 2; height: 350px; }
          .image-grid img:first-child:nth-last-child(3) { grid-column: span 2; height: 300px; }
          
          h2 { color: #0F172A; border-left: 4px solid #FACC15; padding-left: 10px; margin-top: 30px; font-size: 20px; }
          
          .specs-container { display: flex; justify-content: space-between; gap: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 13px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
          th { color: #64748b; font-weight: normal; text-transform: uppercase; letter-spacing: 0.5px; width: 45%; }
          td { font-weight: bold; color: #0F172A; }
          
          .description { line-height: 1.6; color: #475569; font-size: 13px; padding: 20px; background-color: #f8fafc; border-radius: 8px; margin-top: 10px; white-space: pre-wrap; }
          
          .contact-box { margin-top: 30px; padding: 20px; border: 2px dashed #FACC15; border-radius: 8px; text-align: center; background-color: #fffbeb; }
          .contact-box h4 { margin: 0 0 5px 0; color: #0F172A; font-size: 16px; }
          .contact-box p { margin: 0; color: #b45309; font-weight: bold; font-size: 18px; }

          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${property.name}</h1>
          <h3>${property.address?.houseno ? property.address.houseno + ', ' : ''}${property.address?.street || ''}, ${property.address?.city || ''} ${property.address?.pincode || ''}</h3>
          <div class="badge">${property.type} ${property.rental ? '| For Rent' : ''} ${property.selling ? '| For Sale' : ''}</div>
        </div>

        ${validImages.length > 0 ? `
          <div class="image-grid">
            ${validImages.map(src => `<img src="${src}" />`).join('')}
          </div>
        ` : ''}

        <div class="specs-container">
          <div style="flex: 1;">
            <h2>Pricing & Area</h2>
            <table>
              <tr><th>Asking Price/Rent</th><td>${property.price ? `₹ ${property.price}` : 'N/A'}</td></tr>
              <tr><th>Maintenance</th><td>${property.maintenanceCost || 'N/A'}</td></tr>
              <tr><th>Carpet Area</th><td>${property.carpetarea ? `${property.carpetarea} sq.ft` : '-'}</td></tr>
              <tr><th>Super Built-up</th><td>${property.superbuilderarea ? `${property.superbuilderarea} sq.ft` : '-'}</td></tr>
              <tr><th>Land Area</th><td>${property.landarea ? `${property.landarea}` : '-'}</td></tr>
            </table>
          </div>

          <div style="flex: 1;">
            <h2>Rooms & Features</h2>
            <table>
              <tr><th>Bedrooms</th><td>${property.noofbedrooms || '-'}</td></tr>
              <tr><th>Bathrooms</th><td>${property.noofbathrooms || '-'}</td></tr>
              <tr><th>Halls / Living</th><td>${property.noofhalls || '-'}</td></tr>
              <tr><th>Kitchens</th><td>${property.noofkitchens || '-'}</td></tr>
              <tr><th>Balconies</th><td>${property.noofbalcony || '-'}</td></tr>
              <tr><th>Parking</th><td>${property.noofparking || '-'}</td></tr>
              <tr><th>Furnished</th><td>${property.furnished ? 'Yes' : 'No'}</td></tr>
            </table>
          </div>
        </div>

        <h2>Legal & Amenities</h2>
        <table>
          <tr><th>Completion Cert. (CC)</th><td>${property.cc ? 'Available' : 'Pending/Not Available'}</td></tr>
          <tr><th>Mutation Status</th><td>${property.mutation ? 'Complete' : 'Pending/Not Available'}</td></tr>
          <tr><th>RERA Number</th><td>${property.rera || 'N/A'}</td></tr>
          <tr><th>Amenities</th><td>${property.amenities && property.amenities.length > 0 ? property.amenities.join(', ') : 'None listed'}</td></tr>
        </table>
        
        <h2>Property Description</h2>
        <div class="description">${property.description || 'No description provided by the owner/broker.'}</div>

        <div class="contact-box">
          <h4>Interested? Contact for Details</h4>
          <p>${contactName} | 📞 ${contactPhone}</p>
        </div>

        <div class="footer">
          <p>Brochure generated securely by OneSqrFeet</p>
        </div>
      </body>
      </html>
    `;

    console.log("🚀 Launching Puppeteer...");
    
    const browser = await puppeteer.launch({ 
      headless: true, 
      channel: 'chrome', 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ] 
    });
    
    const page = await browser.newPage();
    
    // Set a higher timeout (60s) just in case downloading 6 images takes a few extra seconds
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log("🖨️ Printing to PDF...");
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    
    await browser.close();
    console.log("✅ PDF successfully generated!");

    const binaryPdf = Buffer.from(pdfBuffer);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': binaryPdf.length,
      'Content-Disposition': `inline; filename="${property.name.replace(/\s+/g, '_')}_Brochure.pdf"`
    });

    res.end(binaryPdf);

  } catch (error) {
    console.error("🔥 PDF Generation Error:", error);
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; color: red;">
        <h2>Oops! Failed to generate PDF.</h2>
        <p>Error: ${error.message}</p>
        <p>Please check your backend terminal for the full error log.</p>
      </div>
    `);
  }
});

export default router;