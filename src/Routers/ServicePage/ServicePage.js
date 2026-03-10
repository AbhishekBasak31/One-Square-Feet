import express from "express";
import { 
  getServicePage, 
  createServicePage, 
  updateServicePage, 
  deleteServicePage 
} from "../../Controllers/ServicePage/ServicePage.js";
import { upload } from "../../Middleware/Multer.js"; // Adjust path

const ServicePageRouter = express.Router();

// Middleware to handle single image upload
const uploadFields = upload.fields([{ name: "heroImg", maxCount: 1 }]);

ServicePageRouter.get("/", getServicePage);
ServicePageRouter.post("/", uploadFields, createServicePage);
ServicePageRouter.patch("/", uploadFields, updateServicePage); 
ServicePageRouter.delete("/", deleteServicePage);

export default ServicePageRouter;