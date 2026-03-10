import express from "express";
import { upload } from "../../Middleware/Multer.js";
import {
  getIndustrialSec,
  createIndustrialSec,
  updateIndustrialSec,
  deleteIndustrialSec
} from "../../Controllers/Global/Industrial.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const IndustrialSecRouter = express.Router();

// Use upload.any() to handle dynamic fields like card_img_0, card_img_1 etc.
const industrialUploads = upload.any();

IndustrialSecRouter.get("/", getIndustrialSec);

IndustrialSecRouter.use(authenticate);
IndustrialSecRouter.post("/", industrialUploads, createIndustrialSec);
IndustrialSecRouter.patch("/", industrialUploads, updateIndustrialSec);
IndustrialSecRouter.delete("/", deleteIndustrialSec);

export default IndustrialSecRouter;