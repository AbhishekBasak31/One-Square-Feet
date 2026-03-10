import { WhyChooseUs } from "../../Models/HomePage/WhyChooseUs.js"; 
import uploadOnCloudinary from "../../Utils/Clodinary.js"; 

/* ================= GET ================= */
export const getWhyChooseUs = async (req, res) => {
  try {
    const data = await WhyChooseUs.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createWhyChooseUs = async (req, res) => {
  try {
    const existing = await WhyChooseUs.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    // Destructure all text fields including the new Alt Tags
    const { 
        Htext, Dtext, 
        card1Htext, card1Dtext, card1VdaltTag,
        card2Htext, card2Dtext, card2VdaltTag,
        card3Htext, card3Dtext, card3VdaltTag,
        card4Htext, card4Dtext, card4VdaltTag
    } = req.body;

    // Helper to upload a file if it exists
    const uploadFile = async (fileArray) => {
      if (fileArray && fileArray[0]) {
        const result = await uploadOnCloudinary(fileArray[0].path);
        return result ? result.secure_url : "";
      }
      return "";
    };

    // Upload all videos concurrently
    const card1Vd = req.files?.card1Vd ? await uploadFile(req.files.card1Vd) : "";
    const card2Vd = req.files?.card2Vd ? await uploadFile(req.files.card2Vd) : "";
    const card3Vd = req.files?.card3Vd ? await uploadFile(req.files.card3Vd) : "";
    const card4Vd = req.files?.card4Vd ? await uploadFile(req.files.card4Vd) : "";

    // Validation
    if (!card1Vd || !card2Vd || !card3Vd || !card4Vd) {
        return res.status(400).json({ success: false, message: "All 4 videos are required." });
    }

    const newSection = new WhyChooseUs({
      Htext, Dtext,
      card1Htext, card1Dtext, card1Vd, card1VdaltTag,
      card2Htext, card2Dtext, card2Vd, card2VdaltTag,
      card3Htext, card3Dtext, card3Vd, card3VdaltTag,
      card4Htext, card4Dtext, card4Vd, card4VdaltTag,
    });

    await newSection.save();
    return res.status(201).json({ success: true, message: "Created Successfully", data: newSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateWhyChooseUs = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Helper to process update uploads
    const processUpload = async (fieldName) => {
      if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
        const upload = await uploadOnCloudinary(req.files[fieldName][0].path);
        if (upload) updates[fieldName] = upload.secure_url;
      }
    };

    // Process all potential file updates
    await Promise.all([
      processUpload("card1Vd"),
      processUpload("card2Vd"),
      processUpload("card3Vd"),
      processUpload("card4Vd"),
    ]);

    const updatedSection = await WhyChooseUs.findOneAndUpdate(
      {}, 
      { $set: updates }, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Updated Successfully", data: updatedSection });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteWhyChooseUs = async (req, res) => {
  try {
    await WhyChooseUs.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};