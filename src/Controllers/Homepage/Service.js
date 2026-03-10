import { ServiceSec } from "../../Models/HomePage/Service.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getServiceSec = async (req, res) => {
  try {
    const data = await ServiceSec.findOne();
    // If no data exists, return null data but success true so frontend knows to show "Create" state
    if (!data) return res.status(200).json({ success: true, data: null });
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE (User Inputs Data) ================= */
export const createServiceSec = async (req, res) => {
  try {
    const existing = await ServiceSec.findOne();
    if (existing) return res.status(400).json({ message: "Section already exists. Use Update." });

    // NOW USING USER INPUTS INSTEAD OF DUMMY DATA
    const { tag, Htext, Dtext } = req.body;

    const newSec = new ServiceSec({
      tag, 
      Htext, 
      Dtext,
      categories: [],
      services: []
    });

    await newSec.save();
    return res.status(201).json({ success: true, message: "Section Created", data: newSec });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE SECTION INFO ================= */
export const updateSectionInfo = async (req, res) => {
  try {
    const { tag, Htext, Dtext } = req.body;
    
    // Upsert = true ensures it creates if it somehow doesn't exist, though createServiceSec handles the main creation
    const updated = await ServiceSec.findOneAndUpdate(
      {}, 
      { tag, Htext, Dtext }, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ success: true, message: "Info Updated", data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= CATEGORY MANAGEMENT ================= */

// ADD
export const addCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const updated = await ServiceSec.findOneAndUpdate(
      {},
      { $push: { categories: { name, slug } } },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Category Added", data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updateCategory = async (req, res) => {
  try {
    const { catId } = req.params;
    const { name, slug } = req.body;

    const updated = await ServiceSec.findOneAndUpdate(
      { "categories._id": catId },
      { 
        $set: { 
          "categories.$.name": name,
          "categories.$.slug": slug
        } 
      },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Category Updated", data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE
export const removeCategory = async (req, res) => {
  try {
    const { catId } = req.params;
    const updated = await ServiceSec.findOneAndUpdate(
      {},
      { $pull: { categories: { _id: catId } } },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Category Removed", data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= SERVICE MANAGEMENT ================= */

// ADD
export const addService = async (req, res) => {
  try {
    const { categorySlug, Htext, Dtext, VideoTag, price, discountType } = req.body;
    
    let videoUrl = "";
    if (req.file) {
      const upload = await uploadOnCloudinary(req.file.path);
      if (upload) videoUrl = upload.secure_url;
    }

    const newService = {
      categorySlug, Htext, Dtext, Video: videoUrl, VideoTag, price, discountType
    };

    const updated = await ServiceSec.findOneAndUpdate(
      {},
      { $push: { services: newService } },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Service Added", data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { categorySlug, Htext, Dtext, VideoTag, price, discountType } = req.body;

    const updateFields = {
      "services.$.categorySlug": categorySlug,
      "services.$.Htext": Htext,
      "services.$.Dtext": Dtext,
      "services.$.VideoTag": VideoTag,
      "services.$.price": price,
      "services.$.discountType": discountType
    };

    if (req.file) {
      const upload = await uploadOnCloudinary(req.file.path);
      if (upload) {
        updateFields["services.$.Video"] = upload.secure_url;
      }
    }

    const updated = await ServiceSec.findOneAndUpdate(
      { "services._id": serviceId },
      { $set: updateFields },
      { new: true }
    );

    return res.status(200).json({ success: true, message: "Service Updated", data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE
export const removeService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updated = await ServiceSec.findOneAndUpdate(
      {},
      { $pull: { services: { _id: serviceId } } },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Service Removed", data: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};