import express from "express";
import {
  createHomeAbout,
  getAllHomeAbout,
  updateHomeAbout,
  deleteHomeAbout,
} from "../../Controllers/Homepage/About.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js"; 
import { upload } from "../../Middleware/Multer.js";

const HomeAboutRouter = express.Router();

// Define Image Fields for Multer based on new Schema
const imageFields = upload.fields([
  { name: "tab1Icon", maxCount: 1 },
  { name: "tab2Icon", maxCount: 1 },
  { name: "tab3Icon", maxCount: 1 },
  { name: "tab1img", maxCount: 1 },
  { name: "tab2img", maxCount: 1 },
  { name: "tab3img", maxCount: 1 },
]);

HomeAboutRouter.get("/", getAllHomeAbout);
HomeAboutRouter.post("/", authenticate, imageFields, createHomeAbout);
HomeAboutRouter.patch("/", authenticate, imageFields, updateHomeAbout);
HomeAboutRouter.patch("/:id", authenticate, imageFields, updateHomeAbout);
HomeAboutRouter.delete("/", authenticate, deleteHomeAbout);
HomeAboutRouter.delete("/:id", authenticate, deleteHomeAbout);

export default HomeAboutRouter;