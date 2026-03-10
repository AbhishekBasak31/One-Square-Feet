import express from "express";

import {
  getToolsSection,
  createToolsSection,
  updateToolsSection,
  deleteToolsSection
} from "../../Controllers/Homepage/Tools.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";
import { upload } from "../../Middleware/Multer.js";


const ToolsSectionRouter = express.Router();

// Define Upload Fields for Multer
// Supporting up to 20 tools dynamically (img_0 to img_19)
const imgFields = Array.from({ length: 20 }, (_, i) => ({
  name: `img_${i}`,
  maxCount: 1
}));

const toolsUploads = upload.fields(imgFields);

// Routes
ToolsSectionRouter.get("/", getToolsSection);

// Protected Routes
ToolsSectionRouter.use(authenticate);

ToolsSectionRouter.post("/", toolsUploads, createToolsSection);
ToolsSectionRouter.patch("/", toolsUploads, updateToolsSection);
ToolsSectionRouter.delete("/", deleteToolsSection);

export default ToolsSectionRouter;
