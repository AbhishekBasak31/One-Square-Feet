import { WhyChooseUspage } from "../../Models/AboutPage/Whychooseus.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getWhyChooseUsPage = async (req, res) => {
  try {
    const data = await WhyChooseUspage.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createWhyChooseUsPage = async (req, res) => {
  try {
    const existing = await WhyChooseUspage.findOne();
    if (existing) return res.status(400).json({ success: false, message: "Use Update." });

    const body = req.body;
    const files = req.files || {};

    // Handle Main Image
    if (files.RightsideImg?.[0]) {
      const upload = await uploadOnCloudinary(files.RightsideImg[0].path);
      body.RightsideImg = upload?.secure_url;
    }

    // Process Nested Arrays with Icons
    const processArrayIcons = async (arrayData, filePrefix) => {
      if (!arrayData) return [];
      const parsed = typeof arrayData === 'string' ? JSON.parse(arrayData) : arrayData;
      
      for (let i = 0; i < parsed.length; i++) {
        const fileKey = `${filePrefix}_${i}`;
        if (files[fileKey]?.[0]) {
          const upload = await uploadOnCloudinary(files[fileKey][0].path);
          parsed[i].Icon = upload?.secure_url;
        }
      }
      return parsed;
    };

    body.Features = await processArrayIcons(body.Features, "FeatureIcon");
    body.Stats = await processArrayIcons(body.Stats, "StatIcon");

    const newPage = new WhyChooseUspage(body);
    await newPage.save();
    return res.status(201).json({ success: true, data: newPage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateWhyChooseUsPage = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const files = req.files || {};

    if (files.RightsideImg?.[0]) {
      const upload = await uploadOnCloudinary(files.RightsideImg[0].path);
      body.RightsideImg = upload?.secure_url;
    }

    // Process Arrays: Parse JSON and check for new uploaded icons
    if (body.Features) {
      const features = JSON.parse(body.Features);
      for (let i = 0; i < features.length; i++) {
        if (files[`FeatureIcon_${i}`]?.[0]) {
          const upload = await uploadOnCloudinary(files[`FeatureIcon_${i}`][0].path);
          features[i].Icon = upload.secure_url;
        }
      }
      body.Features = features;
    }

    if (body.Stats) {
      const stats = JSON.parse(body.Stats);
      for (let i = 0; i < stats.length; i++) {
        if (files[`StatIcon_${i}`]?.[0]) {
          const upload = await uploadOnCloudinary(files[`StatIcon_${i}`][0].path);
          stats[i].Icon = upload.secure_url;
        }
      }
      body.Stats = stats;
    }

    const updated = await WhyChooseUspage.findByIdAndUpdate(id, { $set: body }, { new: true });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
/* ================= DELETE ================= */
export const deleteWhyChooseUsPage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await WhyChooseUspage.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }

    return res.status(200).json({ success: true, message: "Page Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};