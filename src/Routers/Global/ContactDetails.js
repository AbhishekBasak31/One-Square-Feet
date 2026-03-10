import express from "express";
import {
  getContactDetails,
  createContactDetails,
  updateContactDetails,
  deleteContactDetails
} from "../../Controllers/Global/ContactDetails.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const ContactDetailsRouter = express.Router();

ContactDetailsRouter.get("/", getContactDetails);

// Protected Routes
ContactDetailsRouter.use(authenticate);
ContactDetailsRouter.post("/", createContactDetails);
ContactDetailsRouter.patch("/", updateContactDetails);
ContactDetailsRouter.delete("/", deleteContactDetails);

export default ContactDetailsRouter;
