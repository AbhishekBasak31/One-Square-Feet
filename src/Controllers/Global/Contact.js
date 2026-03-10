import dotenv from "dotenv";
import { Resend } from "resend";
import {Contact} from "../../Models/Global/Contact.js";
dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

export const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // ---------------- Validation ----------------
    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // ---------------- Save contact ----------------
    const contact = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    if (!contact) {
      return res.status(500).json({
        success: false,
        message: "Contact creation failed",
      });
    }



    return res.status(201).json({
      success: true,
      message: "Contact created and email sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Create Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get all contact submissions
export const getContact = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }); // newest first

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
      message: "Contact data fetched successfully",
    });
  } catch (err) {
    console.error("getContact error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};


    // // ---------------- Send email via Resend ----------------
    // await resend.emails.send({
    //   from: "CD Automation <onboarding@resend.dev>", // or verified domain
    //   to: ["decorafurnish@gmail.com"],
    //   reply_to: email,
    //   subject: `New Contact Received from ${name}`,
    //   html: `
    //     <h3>Contact Details</h3>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Phone:</strong> ${phone}</p>
    //     <p><strong>Message:</strong> ${message}</p>
    //   `,
    // });