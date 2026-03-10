
import { HomeDash } from "../../Models/HomePage/Dashboards.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getHomeDash = async (req, res) => {
  try {
    const data = await HomeDash.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createHomeDash = async (req, res) => {
  try {
    const existing = await HomeDash.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section already exists. Use Update." });
    }

    const { Htext, Dtext, alts, catagories } = req.body;
    let imagesData = [];

    // Process multiple images from req.files array
    if (req.files && req.files.length > 0) {
      // Ensure alts and catagories are arrays (handle single item or undefined)
      const altTexts = Array.isArray(alts) ? alts : (alts ? [alts] : []);
      const catList = Array.isArray(catagories) ? catagories : (catagories ? [catagories] : []);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const upload = await uploadOnCloudinary(file.path);
        
        if (upload) {
          imagesData.push({
            image: upload.secure_url,
            alt: altTexts[i] || "Dashboard Image",
            catagory: catList[i] || "laptop" // Default to laptop if missing
          });
        }
      }
    }

    const newDash = new HomeDash({
      Htext,
      Dtext,
      Images: imagesData,
    });

    await newDash.save();
    return res.status(201).json({ success: true, message: "Dashboard Section Created", data: newDash });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateHomeDash = async (req, res) => {
  try {
    const { id } = req.params;
    const { Htext, Dtext, alts, catagories } = req.body;

    const dashboard = await HomeDash.findById(id);
    if (!dashboard) {
      return res.status(404).json({ success: false, message: "Dashboard section not found" });
    }

    // Update text fields if provided
    if (Htext) dashboard.Htext = Htext;
    if (Dtext) dashboard.Dtext = Dtext;

    // Append new images if uploaded
    if (req.files && req.files.length > 0) {
      const altTexts = Array.isArray(alts) ? alts : (alts ? [alts] : []);
      const catList = Array.isArray(catagories) ? catagories : (catagories ? [catagories] : []);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const upload = await uploadOnCloudinary(file.path);
        
        if (upload) {
          dashboard.Images.push({
            image: upload.secure_url,
            alt: altTexts[i] || "Dashboard Image",
            catagory: catList[i] || "laptop"
          });
        }
      }
    }

    await dashboard.save();
    return res.status(200).json({ success: true, message: "Dashboard Section Updated", data: dashboard });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE SECTION ================= */
export const deleteHomeDash = async (req, res) => {
  try {
    const { id } = req.params;
    await HomeDash.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Dashboard Section Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE SINGLE IMAGE ================= */
export const deleteHomeDashImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    const dashboard = await HomeDash.findById(id);
    if (!dashboard) {
      return res.status(404).json({ success: false, message: "Dashboard section not found" });
    }

    // Remove the specific image from the array
    dashboard.Images = dashboard.Images.filter(img => img._id.toString() !== imageId);
    
    await dashboard.save();
    return res.status(200).json({ success: true, message: "Image Removed", data: dashboard });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
