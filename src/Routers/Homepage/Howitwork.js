import express from "express";
import {
  getHowitWorkSec,
  createHowitWorkSec,
  updateHowitWorkSec,
  deleteHowitWorkSec
} from "../../Controllers/Homepage/Howitwork.js";

import { upload } from "../../Middleware/Multer.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const HowitWorkSecRouter = express.Router();

// Define Upload Fields for Multer
// Supporting up to 10 steps dynamically (icon_0 to icon_9)
const iconFields = Array.from({ length: 10 }, (_, i) => ({
  name: `icon_${i}`,
  maxCount: 1
}));

const workflowUploads = upload.fields(iconFields);

// Routes
HowitWorkSecRouter.get("/", getHowitWorkSec);

// Protected Routes
HowitWorkSecRouter.use(authenticate);

HowitWorkSecRouter.post("/", workflowUploads, createHowitWorkSec);
HowitWorkSecRouter.patch("/", workflowUploads, updateHowitWorkSec);
HowitWorkSecRouter.delete("/", deleteHowitWorkSec);

export default HowitWorkSecRouter;
