import express from "express";
import { upload } from "../../Middleware/Multer.js"; 
import { 
  getFeatureSec, 
  createFeatureSec, 
  updateFeatureSec, 
  deleteFeatureSec 
} from "../../Controllers/Homepage/Features.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";


const FeatureSecRouter = express.Router();

// Middleware to handle dynamically indexed image uploads (e.g., img_0, img_1, ...)
// Supporting up to 20 feature cards.
const featureUploads = upload.fields(
    Array.from({ length: 20 }, (_, i) => [
        { name: `cardsizeImg_${i}`, maxCount: 1 },
        { name: `largesizeImg_${i}`, maxCount: 1 }
    ]).flat()
);

FeatureSecRouter.get("/", getFeatureSec);
FeatureSecRouter.use(authenticate);
FeatureSecRouter.post("/", featureUploads, createFeatureSec);
FeatureSecRouter.patch("/", featureUploads, updateFeatureSec); 
FeatureSecRouter.delete("/", deleteFeatureSec);

export default FeatureSecRouter;
