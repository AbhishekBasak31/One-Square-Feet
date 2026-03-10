import express from "express";
import { upload } from "../../Middleware/Multer.js"; 
import { 
  getNewsSec, 
  createNewsSec, 
  updateNewsSec, 
  deleteNewsSec 
} from "../../Controllers/Homepage/NewsSec.js";

const NewsSecRouter = express.Router();

// Middleware to handle 3 separate icon uploads
const newsSecUploads = upload.fields([
  { name: "icon1", maxCount: 1 },
  { name: "icon2", maxCount: 1 },
  { name: "icon3", maxCount: 1 }
]);

NewsSecRouter.get("/", getNewsSec);
NewsSecRouter.post("/", newsSecUploads, createNewsSec);
NewsSecRouter.patch("/", newsSecUploads, updateNewsSec); 
NewsSecRouter.delete("/", deleteNewsSec);

export default NewsSecRouter;