import { ServicePage } from "../../Models/ServicePage/ServicePage.js"; // Adjust path
import uploadOnCloudinary from "../../Utils/Clodinary.js"; // Adjust path

/**
 * HELPER: Upload file if exists
 */
const uploadFile = async (files, key) => {
  if (files && files[key] && files[key][0]) {
    const upload = await uploadOnCloudinary(files[key][0].path);
    return upload?.secure_url || upload?.url;
  }
  return null;
};

/* ================= GET ================= */
export const getServicePage = async (req, res) => {
  try {
    const data = await ServicePage.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createServicePage = async (req, res) => {
  try {
    const existing = await ServicePage.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Service Page config exists. Use Update." });
    }

    const files = req.files || {};
    const body = req.body;

    // Handle Hero Image Upload
    const heroImgUrl = await uploadFile(files, 'heroImg');
    
    if (!heroImgUrl) {
        return res.status(400).json({ success: false, message: "Hero Image is required" });
    }

    const newPage = new ServicePage({
        ...body,
        heroImg: heroImgUrl
    });

    await newPage.save();

    return res.status(201).json({ success: true, message: "Created Successfully", data: newPage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateServicePage = async (req, res) => {
  try {
    const files = req.files || {};
    const updates = { ...req.body };

    // Handle Hero Image Upload (Update only if new file provided)
    const heroImgUrl = await uploadFile(files, 'heroImg');
    if (heroImgUrl) {
        updates.heroImg = heroImgUrl;
    }

    // Upsert: Update if exists, Create if not
    const updatedPage = await ServicePage.findOneAndUpdate(
      {}, 
      { $set: updates }, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Updated Successfully", data: updatedPage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteServicePage = async (req, res) => {
  try {
    await ServicePage.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};