import express from 'express';
import axios from 'axios';
import Property from '../../Models/Global/Property.js';

const router = express.Router();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

router.post('/send-brochure', async (req, res) => {
  try {
    const { propertyId, brokerId, clients } = req.body;

    if (!clients || clients.length === 0) return res.status(400).json({ message: "No clients provided." });

    const property = await Property.findById(propertyId).select('name');
    if (!property) return res.status(404).json({ message: "Property not found." });

    // Generate Dynamic PDF Link with Broker ID Attached!
    const baseUrl = `${process.env.BACKEND_URL || 'https://one-square-feet.onrender.com'}/api/v1/propertypdf/${propertyId}`;
    const pdfDynamicLink = `${baseUrl}?brokerId=${brokerId}`;

    // Map through clients and send Meta API requests
    const sendPromises = clients.map(async (client) => {
      const formattedPhone = client.phone.replace(/\D/g, ''); // Ensure pure numbers
      const messageText = `Hello ${client.name}, \n\nHere are the details for *${property.name}*.\n\nYou can view the full property brochure instantly by clicking here:\n👉 ${pdfDynamicLink}\n\nLet me know if you would like to schedule a visit!`;

      return axios.post(
        `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: { preview_url: true, body: messageText }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    await Promise.allSettled(sendPromises);
    res.status(200).json({ success: true, message: "Messages dispatched to WhatsApp API." });

  } catch (error) {
    console.error("WhatsApp API Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to send messages." });
  }
});

export default router;