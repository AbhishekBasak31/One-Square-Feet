import express from 'express';
import puppeteer from 'puppeteer';
import axios from 'axios';
import Property from '../../Models/Global/Property.js'; 
import Broker from '../../Models/Global/Broker.js'; // 🟢 Added Broker Model to verify the plan

const router = express.Router();

router.get('/:id', async (req, res) => {
  console.log(`\n✅ PDF Route successfully hit for Property ID: ${req.params.id}`);
  
  try {
    const { brokerId } = req.query; // 🟢 Extract the Broker ID from the WhatsApp link URL
    let isPremium = false;
    let sharingBroker = null;

    // 1. Verify the Broker's Subscription Plan
    if (brokerId) {
      try {
        sharingBroker = await Broker.findById(brokerId);
        if (sharingBroker && sharingBroker.planType === 'PREMIUM') {
          isPremium = true;
          console.log(`🔓 Premium Broker (${sharingBroker.name}) detected. Unlocking all PDF data.`);
        } else {
          console.log(`🔒 Free Tier Broker detected. Restricting PDF data.`);
        }
      } catch (err) {
        console.error("⚠️ Could not verify broker plan, defaulting to Free tier.");
      }
    }

    // 2. Fetch Property
    const property = await Property.findById(req.params.id)
      .populate('ownedby')
      .populate('addedByBroker'); 

    if (!property) {
      return res.status(404).send('Property not found');
    }

    console.log("🖼️ Fetching Images and converting to Base64...");
    
    // 3. Process Images
    const imageUrls = property.img ? property.img.slice(0, 6) : [];
    const base64Images = await Promise.all(
      imageUrls.map(async (imgUrl) => {
        try {
          const imageResponse = await axios.get(imgUrl, { 
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
              'Accept': 'image/jpeg, image/png, image/webp, image/*'
            },
            timeout: 15000 
          });

          const contentType = imageResponse.headers['content-type'] || '';
          if (!contentType.startsWith('image/')) return null;

          const imageBase64 = Buffer.from(imageResponse.data, 'binary').toString('base64');
          return `data:${contentType};base64,${imageBase64}`;
        } catch (imgError) {
          return null; 
        }
      })
    );

    const validImages = base64Images.filter(img => img !== null);

    console.log("📄 Generating HTML Template...");
    
    // 4. Contact box should point to the Broker who sent the WhatsApp message!
    const contactName = sharingBroker?.name || property.addedByBroker?.name || 'Authorized Broker';
    const contactPhone = sharingBroker?.phone || property.addedByBroker?.phone || 'Reply to this WhatsApp message';

    // 5. Build Dynamic HTML
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
          
          .image-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
          .image-grid img { width: 100%; height: 200px; object-fit: cover; border-radius: 10px; border: 1px solid #e2e8f0; }
          .image-grid img:first-child:nth-last-child(1) { grid-column: span 2; height: 350px; }
          .image-grid img:first-child:nth-last-child(3) { grid-column: span 2; height: 300px; }
          
          h2 { color: #0F172A; border-left: 4px solid #FACC15; padding-left: 10px; margin-top: 30px; font-size: 20px; }
          
          .specs-container { display: flex; justify-content: space-between; gap: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 13px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
          th { color: #64748b; font-weight: normal; text-transform: uppercase; letter-spacing: 0.5px; width: 45%; }
          td { font-weight: bold; color: #0F172A; }
          
          .description { line-height: 1.6; color: #475569; font-size: 13px; padding: 20px; background-color: #f8fafc; border-radius: 8px; margin-top: 10px; white-space: pre-wrap; }
          .restricted-box { padding: 15px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; color: #b45309; font-size: 13px; font-weight: bold; text-align: center; margin-top: 10px; }
          .video-box { margin-bottom: 20px; padding: 15px; background-color: #f0f9ff; border: 2px dashed #38bdf8; border-radius: 8px; text-align: center; }

          .contact-box { margin-top: 30px; padding: 20px; border: 2px dashed #FACC15; border-radius: 8px; text-align: center; background-color: #fffbeb; }
          .contact-box h4 { margin: 0 0 5px 0; color: #0F172A; font-size: 16px; }
          .contact-box p { margin: 0; color: #b45309; font-weight: bold; font-size: 18px; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${property.name}</h1>
          <h3>
            ${isPremium && property.address?.houseno ? property.address.houseno + ', ' : ''}
            ${isPremium && property.address?.street ? property.address.street + ', ' : ''}
            ${property.address?.city || ''} ${property.address?.pincode || ''}
          </h3>
          <div class="badge">${property.type} ${property.rental ? '| For Rent' : ''} ${property.selling ? '| For Sale' : ''}</div>
        </div>

        ${isPremium && property.video && property.video.length > 0 ? `
          <div class="video-box">
             <h4 style="margin: 0 0 5px 0; color: #0369a1; font-size: 16px;">🎥 Property Video Tour Available</h4>
             <a href="${property.video[0]}" target="_blank" style="color: #0284c7; font-weight: bold; text-decoration: none; font-size: 14px;">Click Here to Watch the Video</a>
          </div>
        ` : ''}

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
              <tr><th>Carpet Area</th><td>${property.carpetarea ? `${property.carpetarea}` : '-'}</td></tr>
              
              ${isPremium ? `
                <tr><th>Super Built-up</th><td>${property.superbuilderarea || '-'}</td></tr>
                <tr><th>Land Area</th><td>${property.landarea || '-'}</td></tr>
              ` : ''}
            </table>
          </div>

          <div style="flex: 1;">
            <h2>Rooms & Features</h2>
            <table>
              <tr><th>Bedrooms</th><td>${property.noofbedrooms || '-'}</td></tr>
              <tr><th>Bathrooms</th><td>${property.noofbathrooms || '-'}</td></tr>
              <tr><th>Furnished</th><td>${property.furnished ? 'Yes' : 'No'}</td></tr>
              
              ${isPremium ? `
                <tr><th>Halls / Living</th><td>${property.noofhalls || '-'}</td></tr>
                <tr><th>Kitchens</th><td>${property.noofkitchens || '-'}</td></tr>
                <tr><th>Balconies</th><td>${property.noofbalcony || '-'}</td></tr>
                <tr><th>Parking</th><td>${property.noofparking || '-'}</td></tr>
              ` : ''}
            </table>
          </div>
        </div>

        <h2>Legal & Amenities</h2>
        ${isPremium ? `
          <table>
            <tr><th>Completion Cert. (CC)</th><td>${property.cc ? 'Available' : 'Pending/Not Available'}</td></tr>
            <tr><th>Mutation Status</th><td>${property.mutation ? 'Complete' : 'Pending/Not Available'}</td></tr>
            <tr><th>RERA Number</th><td>${property.rera || 'N/A'}</td></tr>
            <tr><th>Amenities</th><td>${property.amenities && property.amenities.length > 0 ? property.amenities.join(', ') : 'None listed'}</td></tr>
          </table>
        ` : `
          <div class="restricted-box">
            🔒 Deep specs and Legal details (RERA, CC, Mutation) are restricted.
          </div>
          <table>
            <tr><th>Amenities</th><td>${property.amenities && property.amenities.length > 0 ? property.amenities.join(', ') : 'None listed'}</td></tr>
          </table>
        `}
        
        ${isPremium && (property.ownedby || property.brokerOwnerDetails?.ownerName) ? `
          <h2>Confidential Owner Details</h2>
          <table>
            <tr><th>Owner Name</th><td>${property.ownedby?.name || property.brokerOwnerDetails?.ownerName || 'N/A'}</td></tr>
            <tr><th>Owner Contact</th><td>${property.ownedby?.phone || property.brokerOwnerDetails?.ownerPhone || 'N/A'}</td></tr>
          </table>
        ` : ''}

        <h2>Property Description</h2>
        <div class="description">${property.description || 'No description provided.'}</div>

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
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ] 
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log("🖨️ Printing to PDF...");
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    
    await browser.close();
    console.log("✅ PDF successfully generated!");

    const binaryPdf = Buffer.from(pdfBuffer);

    res.contentType("application/pdf");
    res.setHeader('Content-Disposition', `inline; filename="${property.name.replace(/\s+/g, '_')}_Brochure.pdf"`);
    res.send(binaryPdf);

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