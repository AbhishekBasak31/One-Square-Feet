import express from "express";
import { upload } from "../../Middleware/Multer.js";
import {
  getClientSec,
  createClientSec,
  updateClientSec,
  deleteClientSec
} from "../../Controllers/Global/Clients.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const ClientSecRouter = express.Router();

// Use upload.any() to handle dynamic nested fields like logo_0_1, logo_2_0 etc.
const clientUploads = upload.any();

ClientSecRouter.get("/", getClientSec);

ClientSecRouter.use(authenticate);
ClientSecRouter.post("/", clientUploads, createClientSec);
ClientSecRouter.patch("/", clientUploads, updateClientSec);
ClientSecRouter.delete("/", deleteClientSec);

export default ClientSecRouter;