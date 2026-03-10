import mongoose from "mongoose";
import { Affiliate } from "../../Models/Affiliationpage/Affiliationpage.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ======================================================
   NORMALIZER
====================================================== */
const norm = (v) => (typeof v === "string" ? v.trim() : v);

/* ======================================================
   SAFE IMAGE UPLOAD (ONLY IF REAL NEW FILE)
   — SAME LOGIC AS HomeAbout
====================================================== */
const uploadFileIfChanged = async (files, key) => {
  if (!files || !files[key] || !files[key][0]) return null;

  const file = files[key][0];

  // HARD GUARDS — prevents fake reuploads
  if (
    !file.path ||
    !file.mimetype ||
    !file.originalname ||
    file.size === 0
  ) {
    return null;
  }

  const upload = await uploadOnCloudinary(file.path);
  return upload?.secure_url || null;
};

/* ======================================================
   GET AFFILIATE SECTION
====================================================== */
export const getAffiliate = async (req, res) => {
  try {
    const data = await Affiliate.findOne();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   CREATE AFFILIATE SECTION
====================================================== */
export const createAffiliate = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existing = await Affiliate.findOne().session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Affiliate section already exists. Use update.",
      });
    }

    const body = req.body || {};
    const files = req.files || {};

    // Parse arrays
    if (body.steps && typeof body.steps === "string") {
      body.steps = JSON.parse(body.steps);
    }
    if (body.CTAData && typeof body.CTAData === "string") {
      body.CTAData = JSON.parse(body.CTAData);
    }

    // Upload icons (CREATE requires them)
    const iconFields = ["Card1Icon", "Card2Icon", "Card3Icon"];
    for (const field of iconFields) {
      const url = await uploadFileIfChanged(files, field);
      if (!url) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
      body[field] = url;
    }

    // Normalize strings
    Object.keys(body).forEach((k) => {
      body[k] = norm(body[k]);
    });

    const doc = new Affiliate(body);
    await doc.save({ session });

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Affiliate section created successfully",
      data: doc,
    });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/* ======================================================
   UPDATE AFFILIATE SECTION (PARTIAL + SAFE)
   — MATCHES HomeAbout UPDATE BEHAVIOR
====================================================== */
export const updateAffiliate = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const target = await Affiliate.findOne().session(session);
    if (!target) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Affiliate section not found",
      });
    }

    const body = req.body || {};
    const files = req.files || {};
    const updates = {};

    /* ===============================
       TEXT FIELDS (ONLY IF PROVIDED)
    =============================== */
    const textFields = [
      "HeadTag",
      "Htext", "Dtext",
      "righttext1", "righttext1value",
      "righttext2", "righttext2value",
      "righttext3", "righttext3value",
      "Card1Htext", "Card1Dtext",
      "Card2Htext", "Card2Dtext",
      "Card3Htext", "Card3Dtext",
      "midHtext"
    ];

    textFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = norm(body[field]);
      }
    });

    /* ===============================
       STEPS ARRAY (SAFE PARSE)
    =============================== */
    if (body.steps !== undefined) {
      try {
        updates.steps =
          typeof body.steps === "string"
            ? JSON.parse(body.steps)
            : body.steps;
      } catch {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid steps format",
        });
      }
    }

    /* ===============================
       CTA DATA ARRAY (SAFE PARSE)
    =============================== */
    if (body.CTAData !== undefined) {
      try {
        updates.CTAData =
          typeof body.CTAData === "string"
            ? JSON.parse(body.CTAData)
            : body.CTAData;
      } catch {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid CTAData format",
        });
      }
    }

    /* ===============================
       ICON UPLOADS (ONLY IF CHANGED)
    =============================== */
    const iconFields = ["Card1Icon", "Card2Icon", "Card3Icon"];
    for (const field of iconFields) {
      const newUrl = await uploadFileIfChanged(files, field);
      if (newUrl) {
        updates[field] = newUrl;
      }
    }

    if (Object.keys(updates).length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "No changes detected",
      });
    }

    const updated = await Affiliate.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, session }
    );

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Affiliate section updated successfully",
      data: updated,
    });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/* ======================================================
   DELETE AFFILIATE SECTION
====================================================== */
export const deleteAffiliate = async (_req, res) => {
  try {
    await Affiliate.findOneAndDelete({});
    return res.status(200).json({
      success: true,
      message: "Affiliate section deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
