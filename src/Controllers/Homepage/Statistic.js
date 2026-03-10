import { StatisticSec } from "../../Models/HomePage/Statistic.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getStatisticSec = async (req, res) => {
  try {
    const data = await StatisticSec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createStatisticSec = async (req, res) => {
  try {
    const existing = await StatisticSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    const body = { ...req.body };

    // Handle Image Uploads
    if (req.files) {
        if (req.files.rightsideCardIcon && req.files.rightsideCardIcon[0]) {
            const up = await uploadOnCloudinary(req.files.rightsideCardIcon[0].path);
            if (up) body.rightsideCardIcon = up.secure_url;
        }
        if (req.files.BottomIcon1 && req.files.BottomIcon1[0]) {
            const up = await uploadOnCloudinary(req.files.BottomIcon1[0].path);
            if (up) body.BottomIcon1 = up.secure_url;
        }
    }

    const newSec = new StatisticSec(body);
    await newSec.save();
    return res.status(201).json({ success: true, message: "Created", data: newSec });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateStatisticSec = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Handle Image Uploads
    if (req.files) {
        if (req.files.rightsideCardIcon && req.files.rightsideCardIcon[0]) {
            const up = await uploadOnCloudinary(req.files.rightsideCardIcon[0].path);
            if (up) updates.rightsideCardIcon = up.secure_url;
        }
        if (req.files.BottomIcon1 && req.files.BottomIcon1[0]) {
            const up = await uploadOnCloudinary(req.files.BottomIcon1[0].path);
            if (up) updates.BottomIcon1 = up.secure_url;
        }
    }

    const updatedSec = await StatisticSec.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Updated", data: updatedSec });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteStatisticSec = async (req, res) => {
  try {
    await StatisticSec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
