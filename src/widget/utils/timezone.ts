/**
 * Maps IANA timezone identifiers to Microsoft timezone names
 * Reference: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/default-time-zones?view=windows-11
 */
export const IANA_TO_MICROSOFT_TIMEZONE_MAP: { [key: string]: string } = {
  // US & Canada
  'America/New_York': 'Eastern Standard Time',
  'America/Detroit': 'Eastern Standard Time',
  'America/Kentucky/Louisville': 'Eastern Standard Time',
  'America/Kentucky/Monticello': 'Eastern Standard Time',
  'America/Indiana/Indianapolis': 'US Eastern Standard Time',
  'America/Indiana/Vincennes': 'US Eastern Standard Time',
  'America/Indiana/Winamac': 'US Eastern Standard Time',
  'America/Indiana/Marengo': 'US Eastern Standard Time',
  'America/Indiana/Petersburg': 'Eastern Standard Time',
  'America/Indiana/Vevay': 'US Eastern Standard Time',
  'America/Chicago': 'Central Standard Time',
  'America/Indiana/Tell_City': 'Central Standard Time',
  'America/Indiana/Knox': 'Central Standard Time',
  'America/Menominee': 'Central Standard Time',
  'America/North_Dakota/Center': 'Central Standard Time',
  'America/North_Dakota/New_Salem': 'Central Standard Time',
  'America/North_Dakota/Beulah': 'Central Standard Time',
  'America/Denver': 'Mountain Standard Time',
  'America/Boise': 'Mountain Standard Time',
  'America/Phoenix': 'US Mountain Standard Time',
  'America/Los_Angeles': 'Pacific Standard Time',
  'America/Anchorage': 'Alaskan Standard Time',
  'America/Adak': 'Hawaiian Standard Time',
  'Pacific/Honolulu': 'Hawaiian Standard Time',
  
  // Major international timezones
  'Europe/London': 'GMT Standard Time',
  'Europe/Dublin': 'GMT Standard Time',
  'Europe/Lisbon': 'GMT Standard Time',
  'Europe/Berlin': 'W. Europe Standard Time',
  'Europe/Amsterdam': 'W. Europe Standard Time',
  'Europe/Brussels': 'Romance Standard Time',
  'Europe/Paris': 'Romance Standard Time',
  'Europe/Madrid': 'Romance Standard Time',
  'Europe/Rome': 'W. Europe Standard Time',
  'Europe/Vienna': 'W. Europe Standard Time',
  'Europe/Warsaw': 'Central European Standard Time',
  'Europe/Prague': 'Central Europe Standard Time',
  'Europe/Budapest': 'Central Europe Standard Time',
  'Europe/Bucharest': 'GTB Standard Time',
  'Europe/Athens': 'GTB Standard Time',
  'Europe/Istanbul': 'Turkey Standard Time',
  'Europe/Moscow': 'Russian Standard Time',
  
  // Asia Pacific
  'Asia/Shanghai': 'China Standard Time',
  'Asia/Beijing': 'China Standard Time',
  'Asia/Hong_Kong': 'China Standard Time',
  'Asia/Macau': 'China Standard Time',
  'Asia/Taipei': 'Taipei Standard Time',
  'Asia/Tokyo': 'Tokyo Standard Time',
  'Asia/Seoul': 'Korea Standard Time',
  'Asia/Singapore': 'Singapore Standard Time',
  'Asia/Kuala_Lumpur': 'Singapore Standard Time',
  'Asia/Jakarta': 'SE Asia Standard Time',
  'Asia/Bangkok': 'SE Asia Standard Time',
  'Asia/Ho_Chi_Minh': 'SE Asia Standard Time',
  'Asia/Manila': 'Singapore Standard Time',
  'Asia/Kolkata': 'India Standard Time',
  'Asia/Mumbai': 'India Standard Time',
  'Asia/Dubai': 'Arabian Standard Time',
  'Asia/Riyadh': 'Arab Standard Time',
  
  // Australia & New Zealand
  'Australia/Sydney': 'AUS Eastern Standard Time',
  'Australia/Melbourne': 'AUS Eastern Standard Time',
  'Australia/Brisbane': 'E. Australia Standard Time',
  'Australia/Adelaide': 'Cen. Australia Standard Time',
  'Australia/Darwin': 'AUS Central Standard Time',
  'Australia/Perth': 'W. Australia Standard Time',
  'Pacific/Auckland': 'New Zealand Standard Time',
  
  // South America
  'America/Sao_Paulo': 'E. South America Standard Time',
  'America/Argentina/Buenos_Aires': 'Argentina Standard Time',
  'America/Santiago': 'Pacific SA Standard Time',
  'America/Bogota': 'SA Pacific Standard Time',
  'America/Lima': 'SA Pacific Standard Time',
  
  // Africa
  'Africa/Cairo': 'Egypt Standard Time',
  'Africa/Johannesburg': 'South Africa Standard Time',
  'Africa/Lagos': 'W. Central Africa Standard Time',
  'Africa/Nairobi': 'E. Africa Standard Time',
};

/**
 * Maps common UTC offsets (in minutes) to Microsoft timezone names
 * Used as fallback when IANA timezone is not directly mapped
 */
export const UTC_OFFSET_TO_MICROSOFT_TIMEZONE_MAP: Record<number, string> = {
  720: 'Hawaiian Standard Time',        // UTC-12
  660: 'Alaskan Standard Time',         // UTC-11
  600: 'Pacific Standard Time',         // UTC-10
  540: 'Pacific Standard Time',         // UTC-9 (during DST)
  480: 'Mountain Standard Time',        // UTC-8
  420: 'Mountain Standard Time',        // UTC-7 (during DST)
  360: 'Central Standard Time',         // UTC-6
  300: 'Central Standard Time',         // UTC-5 (during DST)
  240: 'Eastern Standard Time',         // UTC-4 (during DST)
  180: 'SA Eastern Standard Time',      // UTC-3
  120: 'Mid-Atlantic Standard Time',    // UTC-2
  60: 'Azores Standard Time',           // UTC-1
  0: 'GMT Standard Time',               // UTC+0
  [-60]: 'W. Europe Standard Time',     // UTC+1
  [-120]: 'W. Europe Standard Time',    // UTC+2
  [-180]: 'Russian Standard Time',      // UTC+3
  [-240]: 'Arabian Standard Time',      // UTC+4
  [-300]: 'West Asia Standard Time',    // UTC+5
  [-330]: 'India Standard Time',        // UTC+5:30
  [-360]: 'Central Asia Standard Time', // UTC+6
  [-420]: 'SE Asia Standard Time',      // UTC+7
  [-480]: 'China Standard Time',        // UTC+8
  [-540]: 'Tokyo Standard Time',        // UTC+9
  [-600]: 'AUS Eastern Standard Time',  // UTC+10
  [-660]: 'Central Pacific Standard Time', // UTC+11
  [-720]: 'New Zealand Standard Time', // UTC+12
};

/**
 * Converts the browser's IANA timezone to Microsoft timezone name
 * @returns Microsoft timezone name string
 */
export function getCustomerTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Try direct mapping first
    if (IANA_TO_MICROSOFT_TIMEZONE_MAP[timeZone]) {
      return IANA_TO_MICROSOFT_TIMEZONE_MAP[timeZone];
    }
    
    // Fallback: try to determine from offset
    const now = new Date();
    const offset = now.getTimezoneOffset();
    
    if (UTC_OFFSET_TO_MICROSOFT_TIMEZONE_MAP[offset]) {
      return UTC_OFFSET_TO_MICROSOFT_TIMEZONE_MAP[offset];
    }
    
    // Final fallback
    return 'UTC';
    
  } catch (error) {
    console.warn('Failed to determine timezone, using UTC as fallback:', error);
    return 'UTC';
  }
}

/**
 * Gets the current browser timezone as IANA identifier
 * @returns IANA timezone identifier (e.g., 'America/New_York')
 */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to get browser timezone:', error);
    return 'UTC';
  }
}

/**
 * Gets the current UTC offset in minutes
 * @returns UTC offset in minutes (negative values are ahead of UTC)
 */
export function getUTCOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Converts Microsoft timezone name to IANA timezone identifier
 * @param timeZone Microsoft timezone name or IANA identifier
 * @returns IANA timezone identifier or the original value if already valid
 */
export function toIanaTimeZone(timeZone: string): string {
  // First check if it's already a valid IANA timezone
  try {
    new Date().toLocaleString('en-US', { timeZone });
    return timeZone; // It's already valid
  } catch {
    // Not a valid IANA timezone, try to convert from Microsoft format
  }
  
  // Look up Microsoft timezone in our mapping
  for (const [ianaZone, microsoftZone] of Object.entries(IANA_TO_MICROSOFT_TIMEZONE_MAP)) {
    if (microsoftZone === timeZone) {
      return ianaZone;
    }
  }
  
  // If we can't convert, return UTC as fallback
  console.warn(`Unknown timezone: ${timeZone}, falling back to UTC`);
  return 'UTC';
}