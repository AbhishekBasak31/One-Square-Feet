
import { RefundPolicy } from "../../Models/Refund/Refund.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";


/* ================= GET ================= */
export const getRefundPolicy = async (req, res) => {
  try {
    const data = await RefundPolicy.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createRefundPolicy = async (req, res) => {
  try {
    const existing = await RefundPolicy.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Policy already exists. Use Update." });
    }

    const body = req.body;
    const files = req.files || {};

    // 1. Handle Highlights (Array)
    if (body.highlights) {
      try {
        const highlights = JSON.parse(body.highlights);
        for (let i = 0; i < highlights.length; i++) {
          const key = `highlightIcon_${i}`;
          if (files[key] && files[key][0]) {
            const upload = await uploadOnCloudinary(files[key][0].path);
            if (upload) highlights[i].iconName = upload.secure_url;
          }
        }
        body.highlights = highlights;
      } catch (e) {
        return res.status(400).json({ message: "Invalid highlights JSON format" });
      }
    }

    // 2. Handle Exceptions (Array) - Text only
    if (body.exceptions) {
      try {
        body.exceptions = JSON.parse(body.exceptions);
      } catch (e) {
        return res.status(400).json({ message: "Invalid exceptions JSON format" });
      }
    }

    const newPolicy = new RefundPolicy(body);
    await newPolicy.save();
    return res.status(201).json({ success: true, message: "Refund Policy Created", data: newPolicy });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateRefundPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const files = req.files || {};

    // 1. Handle Highlights (Array)
    if (body.highlights) {
      try {
        const highlights = JSON.parse(body.highlights);
        for (let i = 0; i < highlights.length; i++) {
          const key = `highlightIcon_${i}`;
          // If new file uploaded, replace URL
          if (files[key] && files[key][0]) {
            const upload = await uploadOnCloudinary(files[key][0].path);
            if (upload) highlights[i].iconName = upload.secure_url;
          }
          // Else keep existing URL from JSON
        }
        body.highlights = highlights;
      } catch (e) {
        return res.status(400).json({ message: "Invalid highlights JSON format" });
      }
    }

    // 2. Handle Exceptions (Array)
    if (body.exceptions) {
      try {
        body.exceptions = JSON.parse(body.exceptions);
      } catch (e) {
        return res.status(400).json({ message: "Invalid exceptions JSON format" });
      }
    }

    const updatedPolicy = await RefundPolicy.findByIdAndUpdate(
      id, // Assuming singleton, but ID passed for consistency or if multiple allowed later
      { $set: body },
      { new: true }
    );
    
    if (!updatedPolicy) {
        // Fallback: try updating the first document if ID not provided or incorrect for singleton
        const fallback = await RefundPolicy.findOneAndUpdate({}, { $set: body }, { new: true });
        if(fallback) return res.status(200).json({ success: true, message: "Refund Policy Updated", data: fallback });
        return res.status(404).json({ success: false, message: "Refund Policy not found" });
    }

    return res.status(200).json({ success: true, message: "Refund Policy Updated", data: updatedPolicy });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteRefundPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RefundPolicy.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Policy not found" });
    }

    return res.status(200).json({ success: true, message: "Policy Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
