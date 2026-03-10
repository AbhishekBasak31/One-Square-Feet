import express from "express";
import { upload } from "../../Middleware/Multer.js";
import {
  getBlogSec,
  createBlogSec,
  updateBlogSec,
  deleteBlogSec
} from "../../Controllers/Global/Blogs.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const BlogSecRouter = express.Router();

// Use upload.any() to handle dynamic fields like blog_img_0, blog_img_1 etc.
const blogUploads = upload.any();

BlogSecRouter.get("/", getBlogSec);

BlogSecRouter.use(authenticate);
BlogSecRouter.post("/", blogUploads, createBlogSec);
BlogSecRouter.patch("/", blogUploads, updateBlogSec);
BlogSecRouter.delete("/", deleteBlogSec);

export default BlogSecRouter;