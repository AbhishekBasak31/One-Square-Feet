import mongoose from "mongoose";
import { Event } from "../../Models/Global/Event.js"; // Adjust path to your model
import  uploadOnCloudinary  from "../../Utils/Clodinary.js"; 
import slugify from "slugify";

/* ================= CREATE ================= */
export const createEvent = async (req, res) => {
  try {
    const { title, catagory, date, time, description, hostname, hostcontact, location } = req.body;
    
    // 1. Validation
    if (!title || !catagory || !date || !time || !description || !hostname || !hostcontact || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Image Upload
    let imgUrl = "";
    if (req.files && req.files.img && req.files.img[0]) {
      const upload = await uploadOnCloudinary(req.files.img[0].path);
      if (!upload) throw new Error("Image upload failed");
      imgUrl = upload.secure_url;
    } else {
      return res.status(400).json({ message: "Event image is required" });
    }

    // 3. Generate Slug Explicitly (Fixes the "slug is required" error)
    // We generate it here so it is present when the model validates.
    const slug = slugify(title, { lower: true, strict: true });

    // 4. Create
    const newEvent = new Event({
      title,
      slug, // ✅ Pass the generated slug here
      catagory,
      date,
      time,
      description,
      hostname,
      hostcontact,
      location,
      img: imgUrl,
      isActive: true
    });

    await newEvent.save();

    return res.status(201).json({ success: true, message: "Event created", data: newEvent });

  } catch (err) {
    // Handle potential duplicate slug error
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: "An event with this title already exists." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};
/* ================= GET ALL ================= */
export const getAllEvents = async (req, res) => {
  try {
    // Sort by createdAt descending (newest first)
    const events = await Event.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET BY ID ================= */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 1. SANITIZE INPUT: Extract slug out so we don't accidentally save 'null' from frontend
    const { slug, ...otherUpdates } = req.body; 
    const updates = { ...otherUpdates };

    // 2. Handle Image Update
    if (req.files && req.files.img && req.files.img[0]) {
      const upload = await uploadOnCloudinary(req.files.img[0].path);
      if (upload) updates.img = upload.secure_url;
    }

    // 3. Handle Slug Update ONLY if Title changes
    if (updates.title && updates.title !== event.title) {
       updates.slug = slugify(updates.title, { lower: true, strict: true });
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updates, { new: true });

    return res.status(200).json({ success: true, message: "Event updated", data: updatedEvent });

  } catch (err) {
    // Handle Duplicate Key Error specifically
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: "An event with this title/slug already exists." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Event deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};