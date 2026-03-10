import express from "express";
import { upload } from "../../Middleware/Multer.js";
import {
  getStatisticSec,
  createStatisticSec,
  updateStatisticSec,
  deleteStatisticSec
} from "../../Controllers/Homepage/Statistic.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const StatisticSecRouter = express.Router();

const uploads = upload.fields([
  { name: "rightsideCardIcon", maxCount: 1 },
  { name: "BottomIcon1", maxCount: 1 }
]);

StatisticSecRouter.get("/", getStatisticSec);

// Protected Routes
StatisticSecRouter.use(authenticate);
StatisticSecRouter.post("/", uploads, createStatisticSec);
StatisticSecRouter.patch("/", uploads, updateStatisticSec);
StatisticSecRouter.delete("/", deleteStatisticSec);

export default StatisticSecRouter;
