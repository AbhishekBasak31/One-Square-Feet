import { EventSec } from "../../Models/Global/EventSec.js"; // Adjust path if needed

/* ================= GET (Singleton) ================= */
export const getEventSec = async (req, res) => {
  try {
    // Find the first document. If none, return null/empty
    const data = await EventSec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE (Only if empty) ================= */
export const createEventSec = async (req, res) => {
  try {
    // Check if one already exists
    const existing = await EventSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section already exists. Use Update." });
    }

    const { tag, Htext } = req.body;
    if (!tag || !Htext) {
      return res.status(400).json({ message: "Tag and Htext are required" });
    }

    const newSec = new EventSec({ tag, Htext });
    await newSec.save();

    return res.status(201).json({ success: true, message: "Section created", data: newSec });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE (Singleton - No ID) ================= */
export const updateEventSec = async (req, res) => {
  try {
    // Updates the first found document. 
    // 'upsert: true' creates it if it doesn't exist.
    const updatedSec = await EventSec.findOneAndUpdate(
      {}, // Filter: match any (first one)
      { $set: req.body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Section updated", data: updatedSec });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE (Singleton - No ID) ================= */
export const deleteEventSec = async (req, res) => {
  try {
    // Delete the first document found
    const deleted = await EventSec.findOneAndDelete({});
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Nothing to delete" });
    }

    return res.status(200).json({ success: true, message: "Section deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};