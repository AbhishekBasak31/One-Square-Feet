import express from "express";
import { upload, uploadOnCloudinary } from "../../Utils/Clodinary.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const UploadRouter = express.Router();

UploadRouter.post("/universal", authenticate, upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files provided." });
    }

    const uploadedUrls = {};

    for (const file of req.files) {
      const cloudinaryResult = await uploadOnCloudinary(file.path);
      
      if (cloudinaryResult) {
        // If frontend sends multiple files under the same name (e.g., "dashImages[]")
        if (uploadedUrls[file.fieldname]) {
          if (!Array.isArray(uploadedUrls[file.fieldname])) {
            uploadedUrls[file.fieldname] = [uploadedUrls[file.fieldname]];
          }
          uploadedUrls[file.fieldname].push(cloudinaryResult.secure_url);
        } else {
          uploadedUrls[file.fieldname] = cloudinaryResult.secure_url;
        }
      }
    }
    console.log("Uploaded URLs:", uploadedUrls);
    return res.status(200).json({ success: true, urls: uploadedUrls });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default UploadRouter;