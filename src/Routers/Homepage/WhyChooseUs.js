import express from "express";
import { upload } from "../../Middleware/Multer.js"; // Your multer config
import { 
  getWhyChooseUs, 
  createWhyChooseUs, 
  updateWhyChooseUs, 
  deleteWhyChooseUs 
} from "../../Controllers/Homepage/WhyChooseUs.js"; 
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const WhyChooseUsRouter = express.Router();

// Multer Config for 4 different video fields
const videoUploads = upload.fields([
  { name: "card1Vd", maxCount: 1 },
  { name: "card2Vd", maxCount: 1 },
  { name: "card3Vd", maxCount: 1 },
  { name: "card4Vd", maxCount: 1 },
]);

// Routes
WhyChooseUsRouter.get("/", getWhyChooseUs);

// Protected
WhyChooseUsRouter.use(authenticate);
WhyChooseUsRouter.post("/", videoUploads, createWhyChooseUs);
WhyChooseUsRouter.patch("/", videoUploads, updateWhyChooseUs);
WhyChooseUsRouter.delete("/", deleteWhyChooseUs);

export default WhyChooseUsRouter;