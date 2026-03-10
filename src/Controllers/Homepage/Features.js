import { FeatureSec } from "../../Models/HomePage/Features.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

export const getFeatureSec = async (req, res) => {
    try {
        const data = await FeatureSec.findOne();
        return res.status(200).json({ success: true, data: data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const handleUploads = async (featuresList, files) => {
    for (let i = 0; i < featuresList.length; i++) {
        // Handle Card Size Image
        const cardField = `cardsizeImg_${i}`;
        if (files[cardField] && files[cardField][0]) {
            const upload = await uploadOnCloudinary(files[cardField][0].path);
            if (upload) featuresList[i].cardsizeImg = upload.secure_url;
        }

        // Handle Large Size Image
        const largeField = `largesizeImg_${i}`;
        if (files[largeField] && files[largeField][0]) {
            const upload = await uploadOnCloudinary(files[largeField][0].path);
            if (upload) featuresList[i].largesizeImg = upload.secure_url;
        }
    }
    return featuresList;
};

export const createFeatureSec = async (req, res) => {
    try {
        const existing = await FeatureSec.findOne();
        if (existing) return res.status(400).json({ success: false, message: "Use Update." });

        const { Htext, Dtext } = req.body;
        let featuresList = JSON.parse(req.body.Features || "[]");

        if (req.files) {
            featuresList = await handleUploads(featuresList, req.files);
        }

        const newSec = new FeatureSec({ Htext, Dtext, Features: featuresList });
        await newSec.save();
        return res.status(201).json({ success: true, data: newSec });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const updateFeatureSec = async (req, res) => {
    try {
        const { Htext, Dtext } = req.body;
        let featuresList = JSON.parse(req.body.Features || "[]");

        if (req.files) {
            featuresList = await handleUploads(featuresList, req.files);
        }

        const updatedSec = await FeatureSec.findOneAndUpdate(
            {},
            { $set: { Htext, Dtext, Features: featuresList } },
            { new: true, upsert: true }
        );
        return res.status(200).json({ success: true, data: updatedSec });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ================= DELETE ================= */
export const deleteFeatureSec = async (req, res) => {
  try {
    await FeatureSec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Feature Section Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
