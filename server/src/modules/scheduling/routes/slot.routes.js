import express from "express";
import { getAvailableSlots } from "../controllers/slot.controller.js";

const router = express.Router();

router.get("/", getAvailableSlots);

export default router;
