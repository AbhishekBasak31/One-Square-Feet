import express from "express";
import {
  createQuickLink,
  getAllQuickLinks,
  updateQuickLink,
  deleteQuickLink
} from "../../Controllers/Global/QuickLinks.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const QuickLinkRouter = express.Router();

// Public
QuickLinkRouter.get("/", getAllQuickLinks);

// Protected
QuickLinkRouter.use(authenticate);
QuickLinkRouter.post("/", createQuickLink);
QuickLinkRouter.patch("/:id", updateQuickLink);
QuickLinkRouter.delete("/:id", deleteQuickLink);

export default QuickLinkRouter;