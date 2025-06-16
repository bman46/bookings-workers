export function getBookableSlots(
  availability: any[],
  slotDurationMinutes: number,
  date: string // 'YYYY-MM-DD'
): string[] {
  // Collect all available intervals for the date
  const intervals: { start: Date; end: Date }[] = [];
  for (const staff of availability) {
    for (const item of staff.availabilityItems || []) {
      if (
        item.status === 'available' &&
        item.startDateTime?.dateTime?.startsWith(date)
      ) {
        intervals.push({
          start: new Date(item.startDateTime.dateTime),
          end: new Date(item.endDateTime.dateTime),
        });
      }
    }
  }
  // Merge overlapping intervals (optional for multi-staff)
  // For now, just collect all slots where at least one staff is available
  const slots: Set<string> = new Set();
  for (const interval of intervals) {
    let slot = new Date(interval.start);
    while (slot < interval.end) {
      slots.add(slot.toTimeString().slice(0, 5)); // 'HH:MM'
      slot = new Date(slot.getTime() + slotDurationMinutes * 60000);
    }
  }
  // Return sorted unique slots as 'HH:MM' strings
  return Array.from(slots).sort();
}