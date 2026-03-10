import express from "express";
// Removed Multer import as no images are in the new schema
import { 
  getHomeBanner, 
  createHomeBanner, 
  updateHomeBanner, 
  deleteHomeBanner 
} from "../../Controllers/Homepage/Banner.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const HomeBannerRouter = express.Router();

// No image fields defined in the new Schema provided.
// If you add images later, bring back Multer here.

HomeBannerRouter.get("/", getHomeBanner);
HomeBannerRouter.post("/", authenticate, createHomeBanner); // No upload middleware needed
HomeBannerRouter.patch("/", authenticate, updateHomeBanner); // No upload middleware needed
HomeBannerRouter.delete("/", authenticate, deleteHomeBanner);

export default HomeBannerRouter;