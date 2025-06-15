// Utility functions
class BookingUtils {
    static formatTimeSlot(date) {
        const options = { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        };
        return date.toLocaleTimeString('en-US', options);
    }

    static formatDuration(duration) {
        if (!duration) return 'Duration not specified';
        
        if (duration.startsWith('PT')) {
            let totalMinutes = 0;
            
            const hourMatch = duration.match(/(\d+)H/);
            if (hourMatch) {
                totalMinutes += parseInt(hourMatch[1]) * 60;
            }
            
            const minuteMatch = duration.match(/(\d+)M/);
            if (minuteMatch) {
                totalMinutes += parseInt(minuteMatch[1]);
            }
            
            if (totalMinutes >= 60) {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
            } else {
                return `${totalMinutes}m`;
            }
        }
        
        const numericDuration = parseInt(duration);
        if (!isNaN(numericDuration)) {
            if (numericDuration >= 60) {
                const hours = Math.floor(numericDuration / 60);
                const minutes = numericDuration % 60;
                return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
            } else {
                return `${numericDuration}m`;
            }
        }
        
        return duration;
    }

    static formatPrice(price, priceType) {
        if (!price && price !== 0) return 'Price on request';
        
        switch (priceType) {
            case 'fixedPrice':
                return `$${price.toFixed(2)}`;
            case 'startingAt':
                return `From $${price.toFixed(2)}`;
            case 'priceVaries':
                return 'Price varies';
            case 'free':
                return 'Free';
            case 'notSet':
            default:
                return price > 0 ? `$${price.toFixed(2)}` : 'Free';
        }
    }

    static getServiceIcon(serviceName) {
        const name = serviceName.toLowerCase();
        
        if (name.includes('repair')) return '🔧';
        if (name.includes('cut') || name.includes('hair')) return '✂️';
        if (name.includes('massage')) return '💆';
        if (name.includes('facial') || name.includes('skin')) return '✨';
        if (name.includes('nail')) return '💅';
        if (name.includes('consultation')) return '💬';
        if (name.includes('estimate')) return '📋';
        if (name.includes('service')) return '⚙️';
        if (name.includes('appointment')) return '📅';
        
        return '🔹';
    }

    static getServiceDurationMinutes(duration) {
        // Parse ISO 8601 duration format (e.g., "PT15M" = 15 minutes)
        if (duration && duration.startsWith('PT')) {
            const match = duration.match(/PT(\d+)M/);
            if (match) {
                return parseInt(match[1], 10);
            }
        }
        return 15; // Default to 15 minutes
    }

    static formatSelectedDateTime(selectedDateTime) {
        if (!selectedDateTime) return '';
        
        const date = new Date(selectedDateTime.dateTime);
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const timeOptions = { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        };
        
        const dateStr = date.toLocaleDateString('en-US', dateOptions);
        const timeStr = date.toLocaleTimeString('en-US', timeOptions);
        
        return `${dateStr} at ${timeStr}`;
    }

    static isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    static getBusinessTimezone(businessData) {
        const businessTimezone = businessData?.bookingPageSettings?.businessTimeZone;
        
        const timezoneMap = {
            'Eastern Standard Time': 'America/New_York',
            'Eastern Daylight Time': 'America/New_York',
            'Central Standard Time': 'America/Chicago',
            'Central Daylight Time': 'America/Chicago',
            'Mountain Standard Time': 'America/Denver',
            'Mountain Daylight Time': 'America/Denver',
            'Pacific Standard Time': 'America/Los_Angeles',
            'Pacific Daylight Time': 'America/Los_Angeles',
            'UTC': 'UTC'
        };
        
        return timezoneMap[businessTimezone] || businessTimezone || 'Eastern Standard Time';
    }
}