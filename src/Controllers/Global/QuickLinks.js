import { QuickLinks } from "../../Models/Global/QuickLinks.js"; // Adjust path
import { Footer } from "../../Models/Global/Footer.js"; 
import mongoose from "mongoose";

const norm = (v) => (typeof v === "string" ? v.trim() : v);

/* ================= CREATE QuickLink ================= */
export const createQuickLink = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { name, link } = req.body;
    
    if (!name || !link) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Name and Link are required" });
    }

    // 1. Create the QuickLink
    const newLink = new QuickLinks({
      name: norm(name),
      link: norm(link),
    });
    await newLink.save({ session });

    // 2. Add to Footer (Singleton logic)
    const footer = await Footer.findOne().session(session);
    if (footer) {
      footer.quickLinks.push(newLink._id);
      await footer.save({ session });
    } else {
        // Optional: If no footer exists, you might want to warn or just create the link orphan
        console.warn("No footer found to attach quick link to.");
    }

    await session.commitTransaction();
    return res.status(201).json({ success: true, data: newLink });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

/* ================= GET ALL ================= */
export const getAllQuickLinks = async (req, res) => {
  try {
    const links = await QuickLinks.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: links });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateQuickLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link } = req.body;

    const updated = await QuickLinks.findByIdAndUpdate(
      id,
      { name: norm(name), link: norm(link) },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Link not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteQuickLink = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;

    const deleted = await QuickLinks.findByIdAndDelete(id, { session });
    if (!deleted) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Link not found" });
    }

    // Remove reference from Footer
    await Footer.updateMany(
      {},
      { $pull: { quickLinks: id } },
      { session }
    );

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Deleted successfully" });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};