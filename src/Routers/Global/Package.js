import express from "express";
import {
  getPackageSec,
  createPackageSec,
  updatePackageSec,
  deletePackageSec
} from "../../Controllers/Global/Package.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";


const PackageRouter = express.Router();

// Routes
PackageRouter.get("/", getPackageSec);

// Protected Routes
PackageRouter.use(authenticate);

PackageRouter.post("/", createPackageSec);
PackageRouter.patch("/", updatePackageSec);
PackageRouter.delete("/", deletePackageSec);

export default PackageRouter;
