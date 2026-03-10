
import HowitWorkSec from "../../Models/HomePage/Howitworks.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";


/* ================= GET ================= */
export const getHowitWorkSec = async (req, res) => {
  try {
    const data = await HowitWorkSec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createHowitWorkSec = async (req, res) => {
  try {
    const existing = await HowitWorkSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    const { Htext, Dtext } = req.body;
    let stepsList = [];

    // 1. Parse Steps JSON
    if (req.body.steps) {
      try {
        stepsList = JSON.parse(req.body.steps);
      } catch (e) {
        return res.status(400).json({ message: "Invalid Steps data format" });
      }
    }

    // 2. Handle Icon Uploads (icon_0, icon_1, etc.)
    if (req.files) {
      for (let i = 0; i < stepsList.length; i++) {
        const fieldName = `icon_${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          const upload = await uploadOnCloudinary(file.path);
          if (upload) {
            stepsList[i].Icon = upload.secure_url;
          }
        }
      }
    }

    const newSection = new HowitWorkSec({
      Htext,
      Dtext,
      steps: stepsList
    });

    await newSection.save();
    return res.status(201).json({ success: true, message: "Created Successfully", data: newSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateHowitWorkSec = async (req, res) => {
  try {
    const { Htext, Dtext } = req.body;
    let stepsList = [];

    // 1. Parse Steps JSON
    if (req.body.steps) {
      try {
        stepsList = JSON.parse(req.body.steps);
      } catch (e) {
        console.error("JSON Parse Error", e);
        return res.status(400).json({ message: "Invalid Steps JSON" });
      }
    }

    // 2. Handle Icon Uploads
    if (req.files) {
      for (let i = 0; i < stepsList.length; i++) {
        const fieldName = `icon_${i}`;
        // If a new file is uploaded for this index, upload it
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          const upload = await uploadOnCloudinary(file.path);
          if (upload) {
            stepsList[i].Icon = upload.secure_url;
          }
        }
      }
    }

    // 3. Update Document
    const updatedSection = await HowitWorkSec.findOneAndUpdate(
      {},
      {
        $set: {
          Htext,
          Dtext,
          steps: stepsList
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Updated Successfully", data: updatedSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteHowitWorkSec = async (req, res) => {
  try {
    await HowitWorkSec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
