import express from "express";
import {
  createFooter,
  getAllFooters,
  updateFooter,
  deleteFooter,
} from "../../Controllers/Global/Footer.js"; 
import { authenticate } from "../../Middleware/AuthMiddlewares.js";
import { upload } from "../../Middleware/Multer.js"; 

const FooterRouter = express.Router();

// Middleware for logo only (Img removed)
const uploadFields = upload.fields([
  { name: "logo", maxCount: 1 }
]);

// Routes
FooterRouter.post("/", authenticate, uploadFields, createFooter);
FooterRouter.get("/", getAllFooters);
FooterRouter.patch("/", authenticate, uploadFields, updateFooter);
FooterRouter.delete("/", authenticate, deleteFooter);

export default FooterRouter;