import express from "express";
import {
  getAboutPage,
  createAboutPage,
  updateAboutPage,
  deleteAboutPage,
} from "../../Controllers/AboutPage/AboutPage.js";
import { upload } from "../../Middleware/Multer.js";

const AboutPageRouter = express.Router();

// Using upload.any() to handle dynamic team member image fields
AboutPageRouter.get("/", getAboutPage);
AboutPageRouter.post("/", upload.any(), createAboutPage);
AboutPageRouter.patch("/:id", upload.any(), updateAboutPage);
AboutPageRouter.delete("/:id", deleteAboutPage);

export default AboutPageRouter;
