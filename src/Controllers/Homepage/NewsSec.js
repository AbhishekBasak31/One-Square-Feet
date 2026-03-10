import { NewsSec } from "../../Models/HomePage/NewSec.js";
import  uploadOnCloudinary  from "../../Utils/Clodinary.js"; 

export const createNewsSec = async (req, res) => {
  try {
    const existing = await NewsSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    const { 
        tag, Htext, dtext,
        counter1, text1, 
        counter2, text2, 
        counter3, text3 
    } = req.body;
    
    // Basic Validation
    if (!tag || !Htext || !dtext) {
        return res.status(400).json({ message: "Tag, Heading, and Description are required" });
    }

    // Process Images
    const icon1Local = req.files?.icon1?.[0]?.path;
    const icon2Local = req.files?.icon2?.[0]?.path;
    const icon3Local = req.files?.icon3?.[0]?.path;

    if (!icon1Local || !icon2Local || !icon3Local) {
        return res.status(400).json({ message: "All 3 icons are required for creation" });
    }

    // Upload to Cloudinary
    const icon1Up = await uploadOnCloudinary(icon1Local);
    const icon2Up = await uploadOnCloudinary(icon2Local);
    const icon3Up = await uploadOnCloudinary(icon3Local);

    if (!icon1Up || !icon2Up || !icon3Up) {
        return res.status(500).json({ message: "Error uploading icons" });
    }

    const newSec = new NewsSec({
        tag, Htext, dtext,
        counter1, text1, icon1: icon1Up.secure_url,
        counter2, text2, icon2: icon2Up.secure_url,
        counter3, text3, icon3: icon3Up.secure_url,
    });

    await newSec.save();
    return res.status(201).json({ success: true, message: "Created", data: newSec });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateNewsSec = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Check and upload files if they exist in request
    if (req.files?.icon1?.[0]) {
        const up = await uploadOnCloudinary(req.files.icon1[0].path);
        if (up) updates.icon1 = up.secure_url;
    }
    if (req.files?.icon2?.[0]) {
        const up = await uploadOnCloudinary(req.files.icon2[0].path);
        if (up) updates.icon2 = up.secure_url;
    }
    if (req.files?.icon3?.[0]) {
        const up = await uploadOnCloudinary(req.files.icon3[0].path);
        if (up) updates.icon3 = up.secure_url;
    }

    const updatedSec = await NewsSec.findOneAndUpdate(
      {}, 
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Updated", data: updatedSec });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ... (Get and Delete remain mostly the same)
export const getNewsSec = async (req, res) => {
    try {
      const data = await NewsSec.findOne();
      return res.status(200).json({ success: true, data: data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteNewsSec = async (req, res) => {
    try {
      await NewsSec.findOneAndDelete({});
      return res.status(200).json({ success: true, message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
};