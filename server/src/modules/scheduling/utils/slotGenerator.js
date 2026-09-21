export const generateSlots = (startTime, endTime, slotDuration) => {
    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const minutesToTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const slots = [];

    for (let currentMinutes = startMinutes; currentMinutes + slotDuration <= endMinutes; currentMinutes += slotDuration) {
        slots.push(minutesToTime(currentMinutes));
    }

    return slots;
};
