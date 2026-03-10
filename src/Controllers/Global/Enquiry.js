import dotenv from "dotenv";
import { Resend } from "resend";
import { Enquiry } from "../../Models/Global/Enquiry.js";
dotenv.config();
// ============================
// Create new enquiry
// ============================
const resend = new Resend(process.env.RESEND_API_KEY);

export const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, enquirie } = req.body;

    // ---------------- Validation ----------------
    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !enquirie?.trim()
    ) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    // ---------------- Save enquiry ----------------
    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      enquirie,
    });

    if (!enquiry) {
      return res.status(500).json({
        error: "Enquiry creation failed",
      });
    }


    return res.status(201).json({
      message: "Enquiry created and email sent successfully",
      data: enquiry,
    });
  } catch (err) {
    console.error("Enquiry Error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};


export const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    if (!enquiries || enquiries.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No enquiries found" 
      });
    }

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error("getAllEnquiries error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

    // // ---------------- Send email (NO SMTP) ----------------
    // await resend.emails.send({
    //  from: "CD Automation <onboarding@resend.dev>",// must be verified in Resend
    //   to: ["decorafurnish@gmail.com"],
    //   reply_to: email, // customer email
    //   subject: `New Enquiry Received from ${name}`,
    //   html: `
    //     <h3>Customer Enquiry</h3>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Phone:</strong> ${phone}</p>
    //     <p><strong>Enquiry:</strong> ${enquirie}</p>
    //   `,
    // });
