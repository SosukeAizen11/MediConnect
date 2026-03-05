import DoctorAvailability from "../models/doctorAvailability.model.js";
import DoctorLeave from "../models/doctorLeave.model.js";
import Appointment from "../models/appointment.model.js";
import Doctor from "../models/doctor.model.js";
import { generateSlots } from "../utils/slotGenerator.js";

export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({
                success: false,
                message: "doctorId and date are required",
            });
        }

        // 1. Parse the date safely to avoid UTC timezone shift
        const [year, month, day] = date.split("-").map(Number);
        const inputDate = new Date(year, month - 1, day);
        const dayOfWeek = inputDate.getDay();

        console.log("=== Slot Generation Debug ===");
        console.log("Doctor ID (from query):", doctorId);
        console.log("Selected date:", date);
        console.log("Parsed date:", inputDate.toDateString());
        console.log("Computed weekday:", dayOfWeek, "(0=Sun, 1=Mon, ..., 6=Sat)");

        // 2. Resolve the doctorId — it could be a Doctor profile _id or a User _id.
        //    DoctorAvailability stores the User _id as 'doctor'.
        //    The frontend sends the Doctor profile _id from the clinic doctors list.
        let userIdForAvailability = doctorId;

        const doctorProfile = await Doctor.findById(doctorId);
        if (doctorProfile) {
            // doctorId is a Doctor profile _id → use its user field
            userIdForAvailability = doctorProfile.user.toString();
            console.log("Resolved Doctor profile → User ID:", userIdForAvailability);
        } else {
            console.log("doctorId is likely a User ID already:", doctorId);
        }

        // 2.5 Check if doctor is on leave
        const leave = await DoctorLeave.findOne({
            doctor: userIdForAvailability,
            date,
        });

        if (leave) {
            console.log("Doctor is on leave:", leave.reason);
            return res.status(200).json({
                success: true,
                slots: [],
                message: "Doctor on leave"
            });
        }

        // 3. Fetch doctor availability using the User ID
        const availability = await DoctorAvailability.findOne({
            doctor: userIdForAvailability,
            dayOfWeek,
            isActive: true,
        });

        console.log("Availability found:", availability ? "YES" : "NO");

        if (!availability) {
            return res.status(200).json({
                success: true,
                slots: [],
            });
        }

        console.log("Start:", availability.startTime, "End:", availability.endTime, "Duration:", availability.slotDuration);

        // 4. Generate slots dynamically
        const slots = generateSlots(
            availability.startTime,
            availability.endTime,
            availability.slotDuration
        );

        console.log("Generated slots count:", slots.length);

        // 5. Fetch booked appointments (match against both Doctor profile _id and User _id)
        const appointments = await Appointment.find({
            $or: [
                { doctor: doctorId },
                { doctor: userIdForAvailability }
            ],
            date,
        });

        // 6. Mark booked slots as unavailable
        const bookedTimes = appointments.map((a) => a.time);

        const finalSlots = slots.map((time) => ({
            time,
            available: !bookedTimes.includes(time),
        }));

        console.log("Booked times:", bookedTimes);
        console.log("Final slots count:", finalSlots.length);
        console.log("=== End Slot Debug ===");

        // 7. Return response
        return res.json({
            success: true,
            slots: finalSlots,
        });
    } catch (error) {
        console.error("Slot generation error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch available slots",
            error: error.message,
        });
    }
};
