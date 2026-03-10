import express from "express";


import {
  getAffiliate,
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
} from "../../Controllers/Affiliationpage/AffiliationPage.js";
import { upload } from "../../Middleware/Multer.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const AffiliateRouter = express.Router();

/* ================= PUBLIC ================= */
AffiliateRouter.get("/", getAffiliate);

/* ================= PROTECTED ================= */
AffiliateRouter.use(authenticate);

// Upload 3 card icons
const affiliateUpload = upload.fields([
  { name: "Card1Icon", maxCount: 1 },
  { name: "Card2Icon", maxCount: 1 },
  { name: "Card3Icon", maxCount: 1 },
]);

AffiliateRouter.post("/", affiliateUpload, createAffiliate);
AffiliateRouter.patch("/", affiliateUpload, updateAffiliate);
AffiliateRouter.delete("/", deleteAffiliate);

export default AffiliateRouter;
