import express from "express";


import {
  createMeta,
  updateMeta,
  getMetaByRoute,
  getAllMeta,
  deleteMeta,
} from "../../Controllers/Global/meta.controller.js";
import { upload } from "../../Middleware/Multer.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const MetaRouter = express.Router();

/* ================= PUBLIC ROUTES ================= */

// Public SEO access (NO AUTH)
// PUBLIC ROUTE — NO AUTH
MetaRouter.get("/route/:route?", getMetaByRoute);


// Optional: home page meta
MetaRouter.get("/route", (req, res) => {
  req.params.route = "";
  return getMetaByRoute(req, res);
});

/* ================= PROTECTED ROUTES ================= */

MetaRouter.use(authenticate);

// Admin CMS
const metaUpload = upload.single("ogImage");

MetaRouter.post("/", metaUpload, createMeta);
MetaRouter.patch("/:id", metaUpload, updateMeta);
MetaRouter.get("/", getAllMeta);
MetaRouter.delete("/:id", deleteMeta);

export default MetaRouter;
