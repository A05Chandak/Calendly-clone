import { Router } from "express";
import {
  createEventType,
  deleteEventType,
  listEventTypes,
  updateEventType
} from "../controllers/eventTypeController.js";

const router = Router();

router.get("/", listEventTypes);
router.post("/", createEventType);
router.put("/:id", updateEventType);
router.delete("/:id", deleteEventType);

export default router;

