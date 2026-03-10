import express from "express";
import {
  getFaqSec,
  createFaqSec,
  updateFaqSec,
  deleteFaqSec
} from "../../Controllers/Global/Faq.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const FaqSecRouter = express.Router();

FaqSecRouter.get("/", getFaqSec);

FaqSecRouter.use(authenticate);
FaqSecRouter.post("/", createFaqSec);
FaqSecRouter.patch("/", updateFaqSec);
FaqSecRouter.delete("/", deleteFaqSec);

export default FaqSecRouter;