import express from "express";
import { upload } from "../../Middleware/Multer.js"; // Your multer config
import { 
  createGallerySec, 
  getGallerySec, 
  updateGallerySec, 
  deleteGallerySec 
} from "../../Controllers/Homepage/GallerySec.js"; // Adjust path to your controller
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const GallerySecRouter = express.Router();

// Define Upload Fields configuration for Multer
// We generate 20 slots to handle up to 20 gallery videos dynamically
const galleryFields = Array.from({ length: 20 }, (_, i) => ({ 
    name: `video_${i}`, 
    maxCount: 1 
}));

const galleryUploads = upload.fields(galleryFields);

// Routes
GallerySecRouter.get("/", getGallerySec);

// Protected Routes
GallerySecRouter.use(authenticate);

GallerySecRouter.post("/", galleryUploads, createGallerySec);
GallerySecRouter.patch("/", galleryUploads, updateGallerySec);
GallerySecRouter.delete("/", deleteGallerySec);

export default GallerySecRouter;