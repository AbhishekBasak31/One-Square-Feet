import { ReviewSection } from "../../Models/HomePage/ReviewSection.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getReviewSection = async (req, res) => {
  try {
    const data = await ReviewSection.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createReviewSection = async (req, res) => {
  try {
    const existing = await ReviewSection.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Review Section already exists. Use Update." });
    }

    const { Htext, Dtext } = req.body;
    let reviews = [];

    // Parse reviews JSON
    if (req.body.reviews) {
      try {
        reviews = JSON.parse(req.body.reviews);
      } catch (e) {
        return res.status(400).json({ message: "Invalid reviews data format" });
      }
    }

    // Handle dynamic image uploads (review_avatar_0, review_avatar_1, etc.)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname.startsWith("review_avatar_")) {
          const index = parseInt(file.fieldname.split("_")[2]);
          if (!isNaN(index) && reviews[index]) {
            const upload = await uploadOnCloudinary(file.path);
            if (upload) {
              reviews[index].avatar = upload.secure_url;
            }
          }
        }
      }
    }

    const newSection = new ReviewSection({
      Htext,
      Dtext,
      reviews
    });

    await newSection.save();
    return res.status(201).json({ success: true, message: "Review Section created", data: newSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateReviewSection = async (req, res) => {
  try {
    const { Htext, Dtext } = req.body;
    let reviews = [];

    // Parse reviews JSON
    if (req.body.reviews) {
      try {
        reviews = JSON.parse(req.body.reviews);
      } catch (e) {
        return res.status(400).json({ message: "Invalid reviews data format" });
      }
    }

    // Handle dynamic image uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname.startsWith("review_avatar_")) {
          const index = parseInt(file.fieldname.split("_")[2]);
          if (!isNaN(index) && reviews[index]) {
            const upload = await uploadOnCloudinary(file.path);
            if (upload) {
              reviews[index].avatar = upload.secure_url;
            }
          }
        }
      }
    }

    const updatedSection = await ReviewSection.findOneAndUpdate(
      {}, 
      { $set: { Htext, Dtext, reviews } }, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Review Section updated", data: updatedSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteReviewSection = async (req, res) => {
  try {
    await ReviewSection.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Review Section deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
