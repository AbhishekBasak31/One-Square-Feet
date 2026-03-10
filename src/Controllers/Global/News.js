import { News } from "../../Models/Global/News.js"; // Adjust path to your model
import  uploadOnCloudinary  from "../../Utils/Clodinary.js"; 

/* ================= CREATE ================= */
export const createNews = async (req, res) => {
  try {
    const { title, Dtext, date } = req.body;

    // 1. Validation
    if (!title || !Dtext || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Image Upload
    let imgUrl = "";
    if (req.files && req.files.img && req.files.img[0]) {
      const upload = await uploadOnCloudinary(req.files.img[0].path);
      if (!upload) {
        return res.status(500).json({ message: "Image upload failed" });
      }
      imgUrl = upload.secure_url;
    } else {
      return res.status(400).json({ message: "News image is required" });
    }

    // 3. Save to DB
    const newNews = new News({
      title,
      Dtext,
      date,
      img: imgUrl,
    });

    await newNews.save();

    return res.status(201).json({ success: true, message: "News created", data: newNews });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET ALL ================= */
export const getAllNews = async (req, res) => {
  try {
    // Sort by createdAt descending (newest first)
    const newsList = await News.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: newsList });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET BY ID ================= */
export const getNewsById = async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) return res.status(404).json({ message: "News item not found" });
    return res.status(200).json({ success: true, data: newsItem });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const newsItem = await News.findById(id);
    if (!newsItem) return res.status(404).json({ message: "News item not found" });

    const updates = { ...req.body };

    // Handle Image Update (Optional)
    if (req.files && req.files.img && req.files.img[0]) {
      const upload = await uploadOnCloudinary(req.files.img[0].path);
      if (upload) updates.img = upload.secure_url;
    }

    const updatedNews = await News.findByIdAndUpdate(id, updates, { new: true });

    return res.status(200).json({ success: true, message: "News updated", data: updatedNews });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    await News.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "News deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};