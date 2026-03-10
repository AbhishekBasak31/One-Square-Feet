import express from "express";
import { upload } from "../../Middleware/Multer.js";
import { 
  getWhyChooseUsPage, 
  createWhyChooseUsPage, 
  updateWhyChooseUsPage,
  deleteWhyChooseUsPage
} from "../../Controllers/AboutPage/WhyChooseUs.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const router = express.Router();

// Define Upload Fields
const uploadFields = [
  { name: "RightsideImg", maxCount: 1 },
];

// Add dynamic fields for Features (up to 20) and Stats (up to 10)
for (let i = 0; i < 20; i++) {
  uploadFields.push({ name: `FeatureIcon_${i}`, maxCount: 1 });
}
for (let i = 0; i < 10; i++) {
  uploadFields.push({ name: `StatIcon_${i}`, maxCount: 1 });
}

const pageUploads = upload.fields(uploadFields);

router.get("/", getWhyChooseUsPage);
router.post("/", authenticate, pageUploads, createWhyChooseUsPage);
router.patch("/:id", authenticate, pageUploads, updateWhyChooseUsPage);
router.delete("/:id", authenticate, deleteWhyChooseUsPage);

export default router;