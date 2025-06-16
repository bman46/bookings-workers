import { parseISODuration } from './isoDuration';

interface TimeSlot {
  time: string;
  available: boolean;
  staffIds: string[];
}

function formatTime12Hour(time24: string): string {
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function getBookableSlots(
  availability: any[],
  slotDurationMinutes: number,
  date: string, // 'YYYY-MM-DD'
  businessHours: any[],
  minimumLeadTime?: string // Add minimum lead time parameter
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

  // Calculate minimum lead time in milliseconds
  let minimumLeadTimeMs = 0;
  if (minimumLeadTime) {
    const leadTimeDuration = parseISODuration(minimumLeadTime);
    
    switch (leadTimeDuration.unit) {
      case 'minutes':
        minimumLeadTimeMs = leadTimeDuration.value * 60 * 1000;
        break;
      case 'hours':
        minimumLeadTimeMs = leadTimeDuration.value * 60 * 60 * 1000;
        break;
      case 'days':
        minimumLeadTimeMs = leadTimeDuration.value * 24 * 60 * 60 * 1000;
        break;
      case 'seconds':
        minimumLeadTimeMs = leadTimeDuration.value * 1000;
        break;
      default:
        minimumLeadTimeMs = 0;
    }
  }

  const now = new Date();
  const minimumBookingTime = new Date(now.getTime() + minimumLeadTimeMs);

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
      const timeStr24 = slotTime.toTimeString().slice(0, 5); // 24-hour format
      const timeStr12 = formatTime12Hour(timeStr24); // Convert to 12-hour format
      
      // Check if slot is within minimum lead time
      const isWithinLeadTime = slotTime < minimumBookingTime;
      
      let availableStaffIds: string[] = []; // Track which staff are available
      
      // Always check for available staff, regardless of lead time
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
              // Add staff ID to available list - use staffId from API
              if (staff.staffId && !availableStaffIds.includes(staff.staffId)) {
                availableStaffIds.push(staff.staffId);
              }
            }
          }
        }
      }

      // A slot is available if it has staff AND is not within lead time
      const available = availableStaffIds.length > 0 && !isWithinLeadTime;

      slots.push({ 
        time: timeStr12, 
        available,
        staffIds: availableStaffIds
      });
      
      slotTime = new Date(slotTime.getTime() + slotDurationMinutes * 60000);
    }
  }
  
  return slots;
}