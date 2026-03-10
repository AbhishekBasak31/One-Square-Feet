import express from "express";
import { upload } from "../../Middleware/Multer.js";
import { 
  createReviewSection, 
  getReviewSection, 
  updateReviewSection, 
  deleteReviewSection 
} from "../../Controllers/Homepage/ReviewSec.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const ReviewSectionRouter = express.Router();

// Use upload.any() to handle dynamic field names like review_avatar_0, review_avatar_1...
const reviewUploads = upload.any(); 

ReviewSectionRouter.get("/", getReviewSection);

// Protected Routes
ReviewSectionRouter.use(authenticate);
ReviewSectionRouter.post("/", reviewUploads, createReviewSection);
ReviewSectionRouter.patch("/", reviewUploads, updateReviewSection);
ReviewSectionRouter.delete("/", deleteReviewSection);

export default ReviewSectionRouter;
