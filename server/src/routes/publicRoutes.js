import { Router } from "express";
import {
  createBooking,
  getDateSlots,
  getMonthSlots,
  getPublicEventType
} from "../controllers/publicController.js";

const router = Router();

router.get("/event-types/:slug", getPublicEventType);
router.get("/event-types/:slug/calendar", getMonthSlots);
router.get("/event-types/:slug/slots", getDateSlots);
router.post("/bookings", createBooking);

export default router;

