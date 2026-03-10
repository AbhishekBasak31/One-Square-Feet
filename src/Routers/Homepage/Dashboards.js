import express from "express";
import { upload } from "../../Middleware/Multer.js";

import {
  getHomeDash,
  createHomeDash,
  updateHomeDash,
  deleteHomeDash,
  deleteHomeDashImage,
} from "../../Controllers/Homepage/Dashboards.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const HomeDashRouter = express.Router();

// Middleware to handle multiple image uploads (array)
// 'images' is the field name expected from the frontend FormData
const dashboardUploads = upload.array("images", 10); // Allow up to 10 images at once

HomeDashRouter.get("/", getHomeDash);

// Protected Routes
HomeDashRouter.use(authenticate);

HomeDashRouter.post("/", dashboardUploads, createHomeDash);
HomeDashRouter.patch("/:id", dashboardUploads, updateHomeDash);
HomeDashRouter.delete("/:id", deleteHomeDash);
HomeDashRouter.delete("/:id/image/:imageId", deleteHomeDashImage);

export default HomeDashRouter;
