import express from "express";
import { upload } from "../../Middleware/Multer.js";
import { 
  getAskXoloPage, 
  createAskXoloPage, 
  updateAskXoloPage,
  deleteAskXoloPage
} from "../../Controllers/AboutPage/AskXolo.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const AskXoloPageRouter = express.Router();

// Define Upload Fields
const uploadFields = [];

// Add dynamic fields for Points (up to 20 points)
// Each point has an Image and an Icon
for (let i = 0; i < 20; i++) {
  uploadFields.push({ name: `PointImage_${i}`, maxCount: 1 });
  uploadFields.push({ name: `PointIcon_${i}`, maxCount: 1 });
}

const pageUploads = upload.fields(uploadFields);

AskXoloPageRouter.get("/", getAskXoloPage);
AskXoloPageRouter.post("/", authenticate, pageUploads, createAskXoloPage);
AskXoloPageRouter.patch("/:id", authenticate, pageUploads, updateAskXoloPage);
AskXoloPageRouter.delete("/:id", authenticate, deleteAskXoloPage);

export default AskXoloPageRouter;