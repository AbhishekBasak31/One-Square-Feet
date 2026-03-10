import express from "express";
import { 
  getEventSec, 
  createEventSec, 
  updateEventSec, 
  deleteEventSec 
} from "../../Controllers/Global/EventSec.js";

const EventSecRouter = express.Router();

// No :id parameters because it's a singleton
EventSecRouter.get("/", getEventSec);
EventSecRouter.post("/", createEventSec);
EventSecRouter.patch("/", updateEventSec); 
EventSecRouter.delete("/", deleteEventSec);

export default EventSecRouter;