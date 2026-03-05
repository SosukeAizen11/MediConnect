import express from "express";
import {
    createAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability,
} from "../controllers/doctorAvailability.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// Protect all routes with authentication and authorize only DOCTOR
router.use(protect, authorize("DOCTOR"));

router.post("/", createAvailability);
router.get("/", getMyAvailability);
router.put("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);

export default router;
