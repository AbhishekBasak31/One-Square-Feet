import express from "express";
import { upload } from "../../Middleware/Multer.js"; // Your multer config
import { 
  createNews, 
  getAllNews, 
  getNewsById, 
  updateNews, 
  deleteNews 
} from "../../Controllers/Global/News.js";

const NewsRouter = express.Router();

// Middleware to handle single image upload field named "img"
const newsUploads = upload.fields([
  { name: "img", maxCount: 1 }
]);

// Routes
NewsRouter.get("/", getAllNews);
NewsRouter.get("/:id", getNewsById);
NewsRouter.post("/", newsUploads, createNews);
NewsRouter.patch("/:id", newsUploads, updateNews);
NewsRouter.delete("/:id", deleteNews);

export default NewsRouter;