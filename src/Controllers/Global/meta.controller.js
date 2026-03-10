import { Meta } from "../../Models/Global/Meta.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* =====================================================
   CREATE META
===================================================== */
export const createMeta = async (req, res) => {
  try {
    const {
      route,
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
    } = req.body;

    if (!route || !title) {
      return res.status(400).json({
        success: false,
        message: "Route and title are required",
      });
    }

    const exists = await Meta.findOne({ route });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Meta already exists for this route",
      });
    }

    let ogImageUrl = "";

    if (req.file) {
      const upload = await uploadOnCloudinary(req.file.path);
      if (upload?.secure_url) {
        ogImageUrl = upload.secure_url;
      }
    }

    const meta = await Meta.create({
      route,
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
      ogImage: ogImageUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Meta created successfully",
      data: meta,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =====================================================
   UPDATE META
===================================================== */
export const updateMeta = async (req, res) => {
  try {
    const { id } = req.params;

    const meta = await Meta.findById(id);
    if (!meta) {
      return res.status(404).json({
        success: false,
        message: "Meta not found",
      });
    }

    const {
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
    } = req.body;

    // ✅ Update only if value exists & not empty
    if (title?.trim()) meta.title = title;
    if (description?.trim()) meta.description = description;
    if (keywords?.trim()) meta.keywords = keywords;
    if (ogTitle?.trim()) meta.ogTitle = ogTitle;
    if (ogDescription?.trim()) meta.ogDescription = ogDescription;

    if (req.file) {
      const upload = await uploadOnCloudinary(req.file.path);
      if (upload?.secure_url) {
        meta.ogImage = upload.secure_url;
      }
    }

    await meta.save();

    return res.status(200).json({
      success: true,
      message: "Meta updated successfully",
      data: meta,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =====================================================
   GET META BY ROUTE (PUBLIC)
===================================================== */
export const getMetaByRoute = async (req, res) => {
  try {
    let routeParam = req.params.route || "";

    // ✅ Normalize route
    let route =
      routeParam === ""
        ? "/"
        : "/" + routeParam.replace(/__/g, "/");

    const meta = await Meta.findOne({ route });

    return res.status(200).json(meta);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =====================================================
   GET ALL META (ADMIN)
===================================================== */
export const getAllMeta = async (_req, res) => {
  try {
    const metaList = await Meta.find().sort({ updatedAt: -1 });
    return res.status(200).json(metaList);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =====================================================
   DELETE META
===================================================== */
export const deleteMeta = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Meta.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Meta not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meta deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
