import express from "express";
import { upload } from "../../Middleware/Multer.js"; 
import { 
  getServiceSec, 
  createServiceSec, 
  updateSectionInfo,
  addCategory,
  updateCategory,
  removeCategory,
  addService,
  updateService,
  removeService
} from "../../Controllers/Homepage/Service.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const ServiceSecRouter = express.Router();

// Base Info
ServiceSecRouter.get("/", getServiceSec);
ServiceSecRouter.post("/", authenticate, createServiceSec); // POST /api/v1/home/servicesec (Create with data)
ServiceSecRouter.patch("/info", authenticate, updateSectionInfo); // PATCH (Update)

// Categories
ServiceSecRouter.post("/category", authenticate, addCategory);
ServiceSecRouter.patch("/category/:catId", authenticate, updateCategory);
ServiceSecRouter.delete("/category/:catId", authenticate, removeCategory);

// Services
ServiceSecRouter.post("/service", authenticate, upload.single("Video"), addService);
ServiceSecRouter.patch("/service/:serviceId", authenticate, upload.single("Video"), updateService);
ServiceSecRouter.delete("/service/:serviceId", authenticate, removeService);

export default ServiceSecRouter;