interface TimeSlot {
  time: string;
  available: boolean;
}

export function getBookableSlots(
  availability: any[],
  slotDurationMinutes: number,
  date: string, // 'YYYY-MM-DD'
  businessHours: any[]
): TimeSlot[] {
  // Parse date explicitly to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day); // month is 0-based
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  const hoursForDay = businessHours.find(
    (d: any) => d.day.toLowerCase() === dayOfWeek
  );
  
  if (!hoursForDay || !hoursForDay.timeSlots?.length) {
    return [];
  }

  const slots: TimeSlot[] = [];
  for (const slot of hoursForDay.timeSlots) {
    // Use explicit date construction to avoid timezone issues
    let slotTime = new Date(year, month - 1, day, 
      parseInt(slot.startTime.slice(0, 2)), 
      parseInt(slot.startTime.slice(3, 5))
    );
    const endTime = new Date(year, month - 1, day, 
      parseInt(slot.endTime.slice(0, 2)), 
      parseInt(slot.endTime.slice(3, 5))
    );

    while (slotTime < endTime) {
      const timeStr = slotTime.toTimeString().slice(0, 5);
      
      let available = false;
      for (const staff of availability) {
        for (const item of staff.availabilityItems || []) {
          if (
            item.status === 'available' && 
            item.startDateTime?.dateTime?.startsWith(date)
          ) {
            const availStart = new Date(item.startDateTime.dateTime);
            const availEnd = new Date(item.endDateTime.dateTime);
            const slotEnd = new Date(slotTime.getTime() + slotDurationMinutes * 60000);
            
            if (slotTime >= availStart && slotEnd <= availEnd) {
              available = true;
              break;
            }
          }
        }
        if (available) break;
      }

      slots.push({ time: timeStr, available });
      slotTime = new Date(slotTime.getTime() + slotDurationMinutes * 60000);
    }
  }
  
  return slots;
}