import { BlogSec } from "../../Models/Global/Blogs.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getBlogSec = async (req, res) => {
  try {
    const data = await BlogSec.findOne();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createBlogSec = async (req, res) => {
  try {
    const exists = await BlogSec.findOne();
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Blog section already exists. Use update.",
      });
    }

    const { htext, dtext } = req.body;
    let blogs = [];

    if (req.body.blogs) {
      blogs = JSON.parse(req.body.blogs);
    }

    // Upload images
    if (req.files?.length) {
      for (const file of req.files) {
        const match = file.fieldname.match(/^blog_img_(\d+)$/);
        if (!match) continue;

        const index = Number(match[1]);
        if (!blogs[index]) continue;

        const upload = await uploadOnCloudinary(file.path);
        if (upload?.secure_url) {
          blogs[index].image = upload.secure_url;
        }
      }
    }

    // Ensure imageAltText
    blogs = blogs.map((b) => ({
      ...b,
      imageAltText: b.imageAltText || b.title || "Blog image",
    }));

    const section = await BlogSec.create({
      htext,
      dtext,
      blogs,
    });

    return res.status(201).json({
      success: true,
      message: "Blog section created successfully",
      data: section,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateBlogSec = async (req, res) => {
  try {
    const { htext, dtext } = req.body;
    let blogs = [];

    if (req.body.blogs) {
      blogs = JSON.parse(req.body.blogs);
    }

    // Upload images (preserve existing)
    if (req.files?.length) {
      await Promise.all(
        req.files.map(async (file) => {
          const match = file.fieldname.match(/^blog_img_(\d+)$/);
          if (!match) return;

          const index = Number(match[1]);
          if (!blogs[index]) return;

          const upload = await uploadOnCloudinary(file.path);
          if (upload?.secure_url) {
            blogs[index].image = upload.secure_url;
          }
        })
      );
    }

    blogs = blogs.map((b) => ({
      ...b,
      imageAltText: b.imageAltText || b.title || "Blog image",
    }));

    const updated = await BlogSec.findOneAndUpdate(
      {},
      { $set: { htext, dtext, blogs } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Blog section updated successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteBlogSec = async (req, res) => {
  try {
    await BlogSec.findOneAndDelete({});
    return res.status(200).json({
      success: true,
      message: "Blog section deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
