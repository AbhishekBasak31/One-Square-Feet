import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { HomeAbout } from "../../Models/HomePage/About.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);

/**
 * HELPER: Upload file if exists
 */
const uploadFile = async (files, key) => {
  if (files && files[key] && files[key][0]) {
    const upload = await uploadOnCloudinary(files[key][0].path);
    return upload?.secure_url || upload?.url;
  }
  return null;
};

/**
 * CREATE HomeAbout
 */
export const createHomeAbout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existing = await HomeAbout.findOne().session(session);
    if (existing) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "HomeAbout already exists. Use update." });
    }

    const files = req.files || {};
    const body = req.body;

    // 1. Define ALL Text Fields based on new Schema
    const textFields = [
      "Htext", "Dtext",
      "tab1Name", "tab2Name", "tab3Name",
      "tab1Desc", "tab2Desc", "tab3Desc",
      "tab1Bp1", "tab1Bp2", "tab1Bp3",
      "tab1imgAltText",
      "tab2Bp1", "tab2Bp2", "tab2Bp3",
      "tab2imgAltText",
      "tab3Bp1", "tab3Bp2", "tab3Bp3",
      "tab3imgAltText",
      "CTAbuttonname", "CTAbuttonUrl"
    ];

    // 2. Define ALL Image Fields based on new Schema
    const imageFields = [
      "tab1Icon", "tab2Icon", "tab3Icon",
      "tab1img", "tab2img", "tab3img"
    ];

    // 3. Validation
    const missing = [];
    textFields.forEach(f => { if (!norm(body[f])) missing.push(f); });
    imageFields.forEach(f => { if (!files[f]) missing.push(f); });

    if (missing.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // 4. Upload Images
    const uploads = {};
    for (const imgKey of imageFields) {
      const url = await uploadFile(files, imgKey);
      if (!url) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: `Failed to upload ${imgKey}` });
      }
      uploads[imgKey] = url;
    }

    // 5. Build Document
    const docData = { ...uploads };
    textFields.forEach(f => { docData[f] = norm(body[f]); });

    const newDoc = new HomeAbout(docData);
    await newDoc.save({ session });
    await session.commitTransaction();

    return res.status(201).json({ success: true, message: "HomeAbout created", data: newDoc });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("createHomeAbout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET ALL
 */
export const getAllHomeAbout = async (req, res) => {
  try {
    const data = await HomeAbout.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * UPDATE HomeAbout
 */
export const updateHomeAbout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find Target (Singleton or ID)
    let target;
    if (req.params.id) {
       if (!isValidObjectId(req.params.id)) throw new Error("Invalid ID");
       target = await HomeAbout.findById(req.params.id).session(session);
    } else {
       target = await HomeAbout.findOne().sort({ createdAt: -1 }).session(session);
    }

    if (!target) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "No document found" });
    }

    const updates = {};
    const body = req.body || {};
    const files = req.files || {};

    // 1. Text Fields Update
    const textFields = [
      "Htext", "Dtext",
      "tab1Name", "tab2Name", "tab3Name",
      "tab1Desc", "tab2Desc", "tab3Desc",
      "tab1Bp1", "tab1Bp2", "tab1Bp3",
      "tab1imgAltText",
      "tab2Bp1", "tab2Bp2", "tab2Bp3",
      "tab2imgAltText",
      "tab3Bp1", "tab3Bp2", "tab3Bp3",
      "tab3imgAltText",
      "CTAbuttonname", "CTAbuttonUrl"
    ];

    textFields.forEach(field => {
        if (body[field] !== undefined) {
            updates[field] = norm(body[field]);
        }
    });

    // 2. Image Fields Update
    const imageFields = [
      "tab1Icon", "tab2Icon", "tab3Icon",
      "tab1img", "tab2img", "tab3img"
    ];

    for (const field of imageFields) {
        const url = await uploadFile(files, field);
        if (url) updates[field] = url;
    }

    if (Object.keys(updates).length === 0) {
       await session.abortTransaction();
       return res.status(400).json({ success: false, message: "No changes provided" });
    }

    const updatedDoc = await HomeAbout.findByIdAndUpdate(target._id, { $set: updates }, { new: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Updated successfully", data: updatedDoc });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * DELETE
 */
export const deleteHomeAbout = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        let target;
        if (req.params.id) {
            target = await HomeAbout.findById(req.params.id).session(session);
        } else {
            target = await HomeAbout.findOne().sort({ createdAt: -1 }).session(session);
        }
        if(!target) {
            await session.abortTransaction();
            return res.status(404).json({success:false, message: "Not found"});
        }
        await HomeAbout.findByIdAndDelete(target._id, {session});
        await session.commitTransaction();
        return res.status(200).json({success:true, message:"Deleted"});
    } catch(err){
        if(session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({success:false, message: err.message});
    } finally {
        session.endSession();
    }
};
