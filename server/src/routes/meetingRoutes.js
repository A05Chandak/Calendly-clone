import { Router } from "express";
import { cancelMeeting, listCancelledMeetings, listMeetings } from "../controllers/meetingController.js";

const router = Router();

router.get("/", listMeetings);
router.get("/cancelled", listCancelledMeetings);
router.post("/:id/cancel", cancelMeeting);

export default router;
