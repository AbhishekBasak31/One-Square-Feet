import express from "express";
import { upload } from "../../Middleware/Multer.js";
import {
  getFocusSec,
  createFocusSec,
  updateFocusSec,
  deleteFocusSec
} from "../../Controllers/Homepage/Focus.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const FocusSecRouter = express.Router();

// Define Upload Fields for Multer
// Supporting up to 10 cards dynamically (icon_0 to icon_9)
const iconFields = Array.from({ length: 10 }, (_, i) => ({
  name: `icon_${i}`,
  maxCount: 1
}));

const focusUploads = upload.fields(iconFields);

// Routes
FocusSecRouter.get("/", getFocusSec);

// Protected Routes
FocusSecRouter.use(authenticate);

FocusSecRouter.post("/", focusUploads, createFocusSec);
FocusSecRouter.patch("/", focusUploads, updateFocusSec);
FocusSecRouter.delete("/", deleteFocusSec);

export default FocusSecRouter;
