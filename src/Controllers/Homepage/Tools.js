
import { ToolsSection } from "../../Models/HomePage/Tools.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";


/* ================= GET ================= */
export const getToolsSection = async (req, res) => {
  try {
    const data = await ToolsSection.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createToolsSection = async (req, res) => {
  try {
    const existing = await ToolsSection.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    const { Htext, Dtext } = req.body;
    let toolsList = [];

    // 1. Parse Tools JSON
    if (req.body.tools) {
      try {
        toolsList = JSON.parse(req.body.tools);
      } catch (e) {
        return res.status(400).json({ message: "Invalid Tools data format" });
      }
    }

    // 2. Handle Image Uploads (img_0, img_1, etc.)
    if (req.files) {
      for (let i = 0; i < toolsList.length; i++) {
        const fieldName = `img_${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          const upload = await uploadOnCloudinary(file.path);
          if (upload) {
            toolsList[i].img = upload.secure_url;
          }
        }
      }
    }

    const newSection = new ToolsSection({
      Htext,
      Dtext,
      tools: toolsList
    });

    await newSection.save();
    return res.status(201).json({ success: true, message: "Created Successfully", data: newSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateToolsSection = async (req, res) => {
  try {
    const { Htext, Dtext } = req.body;
    let toolsList = [];

    // 1. Parse Tools JSON
    if (req.body.tools) {
      try {
        toolsList = JSON.parse(req.body.tools);
      } catch (e) {
        console.error("JSON Parse Error", e);
        return res.status(400).json({ message: "Invalid Tools JSON" });
      }
    }

    // 2. Handle Image Uploads
    if (req.files) {
      for (let i = 0; i < toolsList.length; i++) {
        const fieldName = `img_${i}`;
        // If a new file is uploaded for this index, upload it
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          const upload = await uploadOnCloudinary(file.path);
          if (upload) {
            toolsList[i].img = upload.secure_url;
          }
        }
      }
    }

    // 3. Update Document
    const updatedSection = await ToolsSection.findOneAndUpdate(
      {},
      {
        $set: {
          Htext,
          Dtext,
          tools: toolsList
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
export const deleteToolsSection = async (req, res) => {
  try {
    await ToolsSection.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
