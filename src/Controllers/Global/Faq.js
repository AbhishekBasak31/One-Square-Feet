import { FaqSec } from "../../Models/Global/faq.js";

/* ================= GET ================= */
export const getFaqSec = async (req, res) => {
  try {
    const data = await FaqSec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createFaqSec = async (req, res) => {
  try {
    const existing = await FaqSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    const { htext, dtext } = req.body;
    let faqList = [];

    // 1. Parse FAQ JSON (if sent as string via FormData or just raw array)
    if (req.body.faq) {
      try {
        faqList = typeof req.body.faq === 'string' ? JSON.parse(req.body.faq) : req.body.faq;
      } catch (e) {
        return res.status(400).json({ message: "Invalid FAQ data format" });
      }
    }

    const newSec = new FaqSec({
      htext,
      dtext,
      faq: faqList
    });

    await newSec.save();
    return res.status(201).json({ success: true, message: "Created Successfully", data: newSec });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateFaqSec = async (req, res) => {
  try {
    const { htext, dtext } = req.body;
    let faqList = [];

    if (req.body.faq) {
      try {
        faqList = typeof req.body.faq === 'string' ? JSON.parse(req.body.faq) : req.body.faq;
      } catch (e) {
        return res.status(400).json({ message: "Invalid FAQ data format" });
      }
    }

    const updatedSec = await FaqSec.findOneAndUpdate(
      {},
      { $set: { htext, dtext, faq: faqList } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Updated Successfully", data: updatedSec });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteFaqSec = async (req, res) => {
  try {
    await FaqSec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};