import express from "express";
import { upload } from "../../Middleware/Multer.js"; // Your multer config
import { 
  createEvent, 
  getAllEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent 
} from "../../Controllers/Global/Event.js";
import { authenticate } from "../../Middleware/AuthMiddlewares.js";

const EventRouter = express.Router();

const eventUploads = upload.fields([
  { name: "img", maxCount: 1 }
]);

// Routes
EventRouter.get("/", getAllEvents);
EventRouter.get("/:id", getEventById);

EventRouter.use(authenticate);

EventRouter.post("/", eventUploads, createEvent);
EventRouter.patch("/:id", eventUploads, updateEvent);
EventRouter.delete("/:id", deleteEvent);

export default EventRouter;