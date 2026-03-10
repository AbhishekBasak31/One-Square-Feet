import { ClientSec } from "../../Models/Global/Clients.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getClientSec = async (req, res) => {
  try {
    const data = await ClientSec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createClientSec = async (req, res) => {
  try {
    const existing = await ClientSec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Section exists. Use Update." });
    }

    const { htext, dtext } = req.body;
    let clientList = [];

    // 1. Parse Client JSON
    if (req.body.client) {
      try {
        clientList = JSON.parse(req.body.client);
      } catch (e) {
        return res.status(400).json({ message: "Invalid client data format" });
      }
    }

    // 2. Handle Dynamic File Uploads (logo_{catIndex}_{logoIndex})
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const match = file.fieldname.match(/^logo_(\d+)_(\d+)$/);
        if (match) {
          const catIndex = parseInt(match[1]);
          const logoIndex = parseInt(match[2]);

          if (clientList[catIndex] && clientList[catIndex].logos[logoIndex]) {
            const upload = await uploadOnCloudinary(file.path);
            if (upload) {
              clientList[catIndex].logos[logoIndex].src = upload.secure_url;
            }
          }
        }
      }
    }

    const newSec = new ClientSec({
      htext,
      dtext,
      client: clientList
    });

    await newSec.save();
    return res.status(201).json({ success: true, message: "Created Successfully", data: newSec });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateClientSec = async (req, res) => {
  try {
    const { htext, dtext } = req.body;
    let clientList = [];

    // 1. Parse Client JSON
    if (req.body.client) {
      try {
        clientList = JSON.parse(req.body.client);
      } catch (e) {
        return res.status(400).json({ message: "Invalid client data format" });
      }
    }

    // 2. Handle Dynamic File Uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const match = file.fieldname.match(/^logo_(\d+)_(\d+)$/);
        if (match) {
          const catIndex = parseInt(match[1]);
          const logoIndex = parseInt(match[2]);

          if (clientList[catIndex] && clientList[catIndex].logos[logoIndex]) {
            const upload = await uploadOnCloudinary(file.path);
            if (upload) {
              clientList[catIndex].logos[logoIndex].src = upload.secure_url;
            }
          }
        }
      }
    }

    const updatedSec = await ClientSec.findOneAndUpdate(
      {},
      {
        $set: { htext, dtext, client: clientList }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Updated Successfully", data: updatedSec });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteClientSec = async (req, res) => {
  try {
    await ClientSec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};