import express from "express";
import {
  createDirector,
  getAllDirectors,
  updateDirector,
  deleteDirector
} from "../../Controllers/Global/Director.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";
import { upload } from "../../Middleware/Multer.js";

const DirectorRouter = express.Router();

const uploadMiddleware = upload.single("DirectorImg");

DirectorRouter.get("/", getAllDirectors);

DirectorRouter.use(authenticate);

// Create
DirectorRouter.post("/", uploadMiddleware, createDirector);

// Update
DirectorRouter.patch("/:id", uploadMiddleware, updateDirector);

// Delete
DirectorRouter.delete("/:id", deleteDirector);

export default DirectorRouter;