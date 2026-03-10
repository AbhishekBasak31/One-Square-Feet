import { AboutXolopage } from "../../Models/AboutPage/AboutPage.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

const getFile = (files, fieldName) => {
  if (Array.isArray(files)) {
    return files.find(f => f.fieldname === fieldName);
  }
  return files && files[fieldName] ? files[fieldName][0] : null;
};

export const getAboutPage = async (req, res) => {
  try {
    const data = await AboutXolopage.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createAboutPage = async (req, res) => {
  try {
    const existing = await AboutXolopage.findOne();
    if (existing) return res.status(400).json({ success: false, message: "Page data already exists." });

    const body = req.body;
    const files = req.files || [];

    const singleImageFields = ["OurStoryImg", "OurMissionImg", "OurVisionImg"];
    for (const field of singleImageFields) {
      const file = getFile(files, field);
      if (file) {
        const upload = await uploadOnCloudinary(file.path);
        if (upload) body[field] = upload.secure_url;
      }
    }

    if (body.OurTeam) body.OurTeam = JSON.parse(body.OurTeam);
    if (body.whytochosecards) body.whytochosecards = JSON.parse(body.whytochosecards);

    const newPage = new AboutXolopage(body);
    await newPage.save();
    return res.status(201).json({ success: true, data: newPage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAboutPage = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const files = req.files || [];

    const singleImageFields = ["OurStoryImg", "OurMissionImg", "OurVisionImg"];
    for (const field of singleImageFields) {
      const file = getFile(files, field);
      if (file) {
        const upload = await uploadOnCloudinary(file.path);
        if (upload) body[field] = upload.secure_url;
      }
    }

    if (body.OurTeam) {
      const teamMembers = JSON.parse(body.OurTeam);
      for (let i = 0; i < teamMembers.length; i++) {
        const file = getFile(files, `TeamImg_${i}`);
        if (file) {
          const upload = await uploadOnCloudinary(file.path);
          if (upload) teamMembers[i].Img = upload.secure_url;
        }
      }
      body.OurTeam = teamMembers;
    }

    if (body.whytochosecards) body.whytochosecards = JSON.parse(body.whytochosecards);

    const updatedPage = await AboutXolopage.findByIdAndUpdate(id, { $set: body }, { new: true });
    return res.status(200).json({ success: true, data: updatedPage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
/* ================= DELETE ================= */
export const deleteAboutPage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPage = await AboutXolopage.findByIdAndDelete(id);
    if (!deletedPage) {
      return res.status(404).json({ success: false, message: "About Page not found" });
    }
    return res.status(200).json({ success: true, message: "About Page Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
