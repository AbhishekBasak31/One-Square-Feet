import express from "express";
import { upload } from "../../Middleware/Multer.js";
import { getTerms, createTerms, updateTerms, deleteTerms, deleteSection } from "../../Controllers/TermsandCondition/TermsandCondition.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const router = express.Router();

// Middleware to handle multiple icon uploads
const iconUploads = upload.array("icons", 10);

router.get("/", getTerms);

router.use(authenticate);
router.post("/", iconUploads, createTerms);
router.patch("/:id", iconUploads, updateTerms);
router.delete("/:id", deleteTerms);
router.delete("/:id/section/:sectionId", deleteSection);

export default router;