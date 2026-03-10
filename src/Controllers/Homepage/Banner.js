import mongoose from "mongoose";
import { HomeBanner } from "../../Models/HomePage/Banner.js"; 

const norm = (v) => (typeof v === "string" ? v.trim() : v);

/**
 * CREATE HOME BANNER
 */
export const createHomeBanner = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existing = await HomeBanner.findOne().session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Banner config exists. Use Update." });
    }

    const body = req.body;

    // Build Document Data based on new Schema
    const docData = {
        Htext1: norm(body.Htext1) || "",
        Dtext1: norm(body.Dtext1) || "",
        Htext2: norm(body.Htext2) || "",
        Dtext2: norm(body.Dtext2) || "",
        Htext3: norm(body.Htext3) || "",
        Dtext3: norm(body.Dtext3) || "",
        Htext4: norm(body.Htext4) || "",
        Dtext4: norm(body.Dtext4) || "",
        
        midtext: norm(body.midtext) || "",
        
        button1text: norm(body.button1text) || "",
        button1Url: norm(body.button1Url) || "",
        
        button2text: norm(body.button2text) || "",
        button2Url: norm(body.button2Url) || ""
    };

    const banner = new HomeBanner(docData);
    await banner.save({ session });
    await session.commitTransaction();

    return res.status(201).json({ success: true, message: "Created successfully.", data: banner });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("createHomeBanner error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET HOME BANNER
 */
export const getHomeBanner = async (req, res) => {
  try {
    const data = await HomeBanner.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * UPDATE HOME BANNER
 */
export const updateHomeBanner = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const latest = await HomeBanner.findOne().session(session);
    if (!latest) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "No HomeBanner found." });
    }

    const updates = {};
    const body = req.body;

    // List of all fields in the new schema
    const fields = [
        "Htext1", "Dtext1",
        "Htext2", "Dtext2",
        "Htext3", "Dtext3",
        "Htext4", "Dtext4",
        "midtext",
        "button1text", "button1Url",
        "button2text", "button2Url"
    ];

    fields.forEach(field => {
        if (body[field] !== undefined) {
            updates[field] = norm(body[field]);
        }
    });

    if (Object.keys(updates).length === 0) {
      await session.abortTransaction();
      return res.status(200).json({ success: true, message: "No changes detected." });
    }

    const updated = await HomeBanner.findByIdAndUpdate(latest._id, { $set: updates }, { new: true, session });
    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Updated successfully.", data: updated });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("updateHomeBanner error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * DELETE HOME BANNER
 */
export const deleteHomeBanner = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const latest = await HomeBanner.findOne().session(session);
    
    if (!latest) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Not found." });
    }

    await HomeBanner.findByIdAndDelete(latest._id, { session });
    await session.commitTransaction();
    
    return res.status(200).json({ success: true, message: "Deleted successfully." });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};