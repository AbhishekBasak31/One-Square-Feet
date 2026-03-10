
import { FocusSec } from "../../Models/HomePage/Focus.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getFocusSec = async (req, res) => {
  try {
    const data = await FocusSec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createFocusSec = async (req, res) => {
  try {
    const existing = await FocusSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Focus Section exists. Use Update." });
    }

    const { Htext, Dtext } = req.body;
    let cardsList = [];

    // 1. Parse Cards JSON
    if (req.body.Cards) {
      try {
        cardsList = JSON.parse(req.body.Cards);
      } catch (e) {
        return res.status(400).json({ message: "Invalid Cards data format" });
      }
    }

    // 2. Handle Icon Uploads (icon_0, icon_1, etc.)
    if (req.files) {
      for (let i = 0; i < cardsList.length; i++) {
        const fieldName = `icon_${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          const upload = await uploadOnCloudinary(file.path);
          if (upload) {
            cardsList[i].Icon = upload.secure_url;
          }
        }
      }
    }

    const newSection = new FocusSec({
      Htext,
      Dtext,
      Cards: cardsList
    });

    await newSection.save();
    return res.status(201).json({ success: true, message: "Focus Section Created", data: newSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateFocusSec = async (req, res) => {
  try {
    const { Htext, Dtext } = req.body;
    let cardsList = [];

    // 1. Parse Cards JSON
    if (req.body.Cards) {
      try {
        cardsList = JSON.parse(req.body.Cards);
      } catch (e) {
        console.error("JSON Parse Error", e);
        return res.status(400).json({ message: "Invalid Cards JSON" });
      }
    }

    // 2. Handle Icon Uploads
    if (req.files) {
      for (let i = 0; i < cardsList.length; i++) {
        const fieldName = `icon_${i}`;
        // If a new file is uploaded for this index, upload it
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          const upload = await uploadOnCloudinary(file.path);
          if (upload) {
            cardsList[i].Icon = upload.secure_url;
          }
        }
        // If no new file, cardsList[i].Icon should already contain the old URL from the frontend JSON
      }
    }

    // 3. Update Document
    const updatedSection = await FocusSec.findOneAndUpdate(
      {},
      {
        $set: {
          Htext,
          Dtext,
          Cards: cardsList
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Focus Section Updated", data: updatedSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteFocusSec = async (req, res) => {
  try {
    await FocusSec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Focus Section Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
