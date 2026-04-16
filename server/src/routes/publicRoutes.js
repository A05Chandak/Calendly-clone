import { Router } from "express";
import {
  cancelPublicBooking,
  createBooking,
  getDateSlots,
  getMonthSlots,
  getPublicBooking,
  getPublicEventType,
  reschedulePublicBooking
} from "../controllers/publicController.js";

const router = Router();

router.get("/event-types/:slug", getPublicEventType);
router.get("/event-types/:slug/calendar", getMonthSlots);
router.get("/event-types/:slug/slots", getDateSlots);
router.get("/bookings/:id", getPublicBooking);
router.post("/bookings", createBooking);
router.post("/bookings/:id/cancel", cancelPublicBooking);
router.post("/bookings/:id/reschedule", reschedulePublicBooking);

export default router;
