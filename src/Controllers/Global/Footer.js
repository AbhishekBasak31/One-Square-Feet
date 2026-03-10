import mongoose from "mongoose";
import Footer from "../../Models/Global/Footer.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";
import { isValidObjectId } from "mongoose";

const norm = (v) => (typeof v === "string" ? v.trim() : v);

/**
 * Create Footer
 * Multipart Form Data:
 * - Files: logo (required), Img (required)
 * - Body: copyright (required)
 */
export const createFooter = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Check files (Multer 'fields')
    const logoFile = req.files?.logo?.[0];
    const copyright = norm(req.body.copyright);
    const dtext = norm(req.body.dtext);


    const missing = [];
    if (!logoFile) missing.push("logo file");
    if (!copyright) missing.push("copyright");

    if (missing.length) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // Upload Logo
    const logoUpload = await uploadOnCloudinary(logoFile.path);
    if (!logoUpload) {
      await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Logo upload failed." });
    }

    const footer = new Footer({
      socials: [],
      quickLinks: [], // Initialize empty
      logo: logoUpload.secure_url || logoUpload.url,
      copyright,
      dtext
    });

    await footer.save({ session });
    await session.commitTransaction();

    const populated = await Footer.findById(footer._id)
      .populate("socials")
      .populate("quickLinks");
      
    return res.status(201).json({ success: true, message: "Footer created successfully.", data: populated });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("createFooter error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get all footers
 */
export const getAllFooters = async (req, res) => {
  try {
    const footers = await Footer.find()
      .populate("socials")
      .populate("quickLinks")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: footers });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

/**
 * Update Footer
 * PATCH /
 * - Optional Files: logo, Img
 * - Optional Body: copyright
 */
export const updateFooter = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find latest footer
    const existing = await Footer.findOne({}).sort({ createdAt: -1 }).session(session);
    if (!existing) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "No footer found to update." });
    }

    const updates = {};

    // 1. Handle Copyright
    if (req.body.copyright !== undefined) {
      updates.copyright = norm(req.body.copyright);
    }
   if (req.body.dtext !== undefined) {
      updates.dtext = norm(req.body.dtext);
    }
    // 2. Handle Logo Replacement
    if (req.files?.logo?.[0]) {
      const upload = await uploadOnCloudinary(req.files.logo[0].path);
      if (upload) updates.logo = upload.secure_url || upload.url;
    }

    if (Object.keys(updates).length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update." });
    }

    const updated = await Footer.findByIdAndUpdate(
      existing._id,
      { $set: updates },
      { new: true, runValidators: true, session }
    )
    .populate("socials")
    .populate("quickLinks");

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Footer updated successfully.", data: updated });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("updateFooter error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete Footer
 */
export const deleteFooter = async (req, res) => {
  try {
    const existing = await Footer.findOne({}).sort({ createdAt: -1 });
    if (!existing) return res.status(404).json({ success: false, message: "No footer found to delete." });

    await Footer.findByIdAndDelete(existing._id);
    return res.status(200).json({ success: true, message: "Footer deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};