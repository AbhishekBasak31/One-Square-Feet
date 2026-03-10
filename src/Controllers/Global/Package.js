import { PackageSec } from "../../Models/Global/Packages.js";

/* ================= GET ================= */
export const getPackageSec = async (req, res) => {
  try {
    const data = await PackageSec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createPackageSec = async (req, res) => {
  try {
    const existing = await PackageSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    const { Htext, Dtext } = req.body;
    let packageList = [];

    // 1. Parse Package JSON
    if (req.body.package) {
      try {
        packageList = typeof req.body.package === 'string' ? JSON.parse(req.body.package) : req.body.package;
      } catch (e) {
        return res.status(400).json({ message: "Invalid Package data format" });
      }
    }

    const newSection = new PackageSec({
      Htext,
      Dtext,
      package: packageList
    });

    await newSection.save();
    return res.status(201).json({ success: true, message: "Created Successfully", data: newSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updatePackageSec = async (req, res) => {
  try {
    const { Htext, Dtext } = req.body;
    let packageList = [];

    // 1. Parse Package JSON
    if (req.body.package) {
      try {
        packageList = typeof req.body.package === 'string' ? JSON.parse(req.body.package) : req.body.package;
      } catch (e) {
        console.error("JSON Parse Error", e);
        return res.status(400).json({ message: "Invalid Package JSON" });
      }
    }

    // 3. Update Document
    const updatedSection = await PackageSec.findOneAndUpdate(
      {},
      {
        $set: {
          Htext,
          Dtext,
          package: packageList
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
export const deletePackageSec = async (req, res) => {
  try {
    await PackageSec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
