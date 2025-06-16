export function parseISODuration(duration: string): { value: number, unit: string } {
  // Supports PT15M, PT1H, PT2H30M, P1D, etc.
  const dayMatch = duration.match(/P(\d+)D/);
  if (dayMatch) {
    return { value: parseInt(dayMatch[1], 10), unit: 'day(s)' };
  }
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    if (hours && minutes) {
      return { value: hours * 60 + minutes, unit: 'minutes' };
    }
    if (hours) {
      return { value: hours, unit: 'hour(s)' };
    }
    if (minutes) {
      return { value: minutes, unit: 'minutes' };
    }
  }
  return { value: 0, unit: 'minutes' };
}