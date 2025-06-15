// Scheduling and availability logic
class BookingScheduler {
    constructor(businessData) {
        this.businessData = businessData;
        this.availabilityData = null;
        this.currentStartDate = new Date();
        this.currentStartDate.setHours(0, 0, 0, 0);
    }

    processDailyAvailability(days, selectedServiceData) {
        const dailyAvailability = {};
        
        if (!this.availabilityData || this.availabilityData.length === 0) {
            return dailyAvailability;
        }
        
        days.forEach(day => {
            const dateStr = day.toISOString().split('T')[0];
            const daySlots = [];
            
            this.availabilityData.forEach(staffAvailability => {
                const staffId = staffAvailability.staffId;
                
                staffAvailability.availabilityItems.forEach(item => {
                    if (item.status === 'available') {
                        const startTime = new Date(item.startDateTime.dateTime);
                        const endTime = new Date(item.endDateTime.dateTime);
                        
                        const itemDate = startTime.toISOString().split('T')[0];
                        if (itemDate === dateStr) {
                            const serviceDuration = BookingUtils.getServiceDurationMinutes(selectedServiceData.defaultDuration);
                            const slotDuration = 15; // 15-minute intervals
                            
                            let currentTime = new Date(startTime);
                            while (currentTime.getTime() + (serviceDuration * 60000) <= endTime.getTime()) {
                                daySlots.push({
                                    time: new Date(currentTime),
                                    staffId: staffId
                                });
                                
                                currentTime = new Date(currentTime.getTime() + (slotDuration * 60000));
                            }
                        }
                    }
                });
            });
            
            daySlots.sort((a, b) => a.time.getTime() - b.time.getTime());
            
            if (daySlots.length > 0) {
                dailyAvailability[dateStr] = daySlots;
            }
        });
        
        return dailyAvailability;
    }

    generateDays() {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentStartDate);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }

    navigateDays(dayOffset) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newStartDate = new Date(this.currentStartDate);
        newStartDate.setDate(newStartDate.getDate() + dayOffset);
        
        if (newStartDate < today) {
            this.currentStartDate = new Date(today);
        } else {
            this.currentStartDate = newStartDate;
        }
    }

    getDateRangeDisplay() {
        if (!this.currentStartDate) return '';
        
        const endDate = new Date(this.currentStartDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const startOptions = { month: 'short', day: 'numeric' };
        const endOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        
        const startStr = this.currentStartDate.toLocaleDateString('en-US', startOptions);
        const endStr = endDate.toLocaleDateString('en-US', endOptions);
        
        return `${startStr} - ${endStr}`;
    }

    getAvailableTimeSlots(selectedDate, selectedServiceData) {
        if (!this.availabilityData || this.availabilityData.length === 0) {
            return [];
        }

        const timeSlots = [];
        const serviceDuration = BookingUtils.getServiceDurationMinutes(selectedServiceData.defaultDuration);

        this.availabilityData.forEach(staffAvailability => {
            const staffId = staffAvailability.staffId;
            
            staffAvailability.availabilityItems.forEach(item => {
                if (item.status === 'available') {
                    const startTime = new Date(item.startDateTime.dateTime);
                    const endTime = new Date(item.endDateTime.dateTime);
                    
                    // Check if this availability item is for the selected date
                    const itemDate = startTime.toISOString().split('T')[0];
                    if (itemDate === selectedDate) {
                        const slotDuration = 15; // 15-minute intervals
                        
                        let currentTime = new Date(startTime);
                        
                        // Generate time slots for this availability window
                        while (currentTime.getTime() + (serviceDuration * 60000) <= endTime.getTime()) {
                            timeSlots.push({
                                dateTime: currentTime.toISOString(),
                                staffId: staffId,
                                time: new Date(currentTime)
                            });
                            
                            currentTime = new Date(currentTime.getTime() + (slotDuration * 60000));
                        }
                    }
                }
            });
        });

        // Sort time slots by time
        timeSlots.sort((a, b) => a.time.getTime() - b.time.getTime());
        
        return timeSlots;
    }
}