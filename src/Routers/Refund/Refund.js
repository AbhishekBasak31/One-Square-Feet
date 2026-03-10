import express from "express";
import { upload } from "../../Middleware/Multer.js";
import { 
  getRefundPolicy, 
  createRefundPolicy, 
  updateRefundPolicy,
  deleteRefundPolicy
} from "../../Controllers/Refund/Refund.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const RefundPolicyRouter = express.Router();

// Define Upload Fields
const uploadFields = [];

// Add dynamic fields for Highlights Icons (up to 20)
for (let i = 0; i < 20; i++) {
  uploadFields.push({ name: `highlightIcon_${i}`, maxCount: 1 });
}

const pageUploads = upload.fields(uploadFields);

RefundPolicyRouter.get("/", getRefundPolicy);
RefundPolicyRouter.post("/", authenticate, pageUploads, createRefundPolicy);
RefundPolicyRouter.patch("/:id", authenticate, pageUploads, updateRefundPolicy);
RefundPolicyRouter.delete("/:id", authenticate, deleteRefundPolicy);

export default RefundPolicyRouter;
