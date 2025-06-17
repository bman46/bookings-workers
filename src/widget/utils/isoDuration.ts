export function parseISODuration(duration: string): { value: number; unit: string } {
  // Handle period durations like P10D (10 days), P1M (1 month), etc.
  if (duration.startsWith('P')) {
    const dayMatch = duration.match(/P(\d+)D/);
    if (dayMatch) {
      return { value: parseInt(dayMatch[1], 10), unit: 'days' };
    }
    
    const monthMatch = duration.match(/P(\d+)M/);
    if (monthMatch) {
      return { value: parseInt(monthMatch[1], 10) * 30, unit: 'days' }; // Convert months to days
    }
    
    const yearMatch = duration.match(/P(\d+)Y/);
    if (yearMatch) {
      return { value: parseInt(yearMatch[1], 10) * 365, unit: 'days' }; // Convert years to days
    }
  }
  
  // Handle time durations like PT15M, PT1H, PT12H, etc.
  if (duration.startsWith('PT')) {
    const minuteMatch = duration.match(/PT(\d+)M/);
    if (minuteMatch) {
      return { value: parseInt(minuteMatch[1], 10), unit: 'minutes' };
    }
    
    const hourMatch = duration.match(/PT(\d+)H/);
    if (hourMatch) {
      return { value: parseInt(hourMatch[1], 10), unit: 'hours' }; // Keep as hours
    }
    
    const secondMatch = duration.match(/PT(\d+)S/);
    if (secondMatch) {
      return { value: parseInt(secondMatch[1], 10), unit: 'seconds' };
    }
  }
  
  // Default fallback
  return { value: 60, unit: 'days' };
}