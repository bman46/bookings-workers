// API communication layer
class BookingAPI {
    constructor(apiUrl, businessSlug) {
        this.apiUrl = apiUrl;
        this.businessSlug = businessSlug;
    }

    async loadBusinessData() {
        const response = await fetch(`${this.apiUrl}/api/tasks/${this.businessSlug}`);
        const data = await response.json();
        
        if (data.success && data.result && data.result.task) {
            return data.result.task;
        }
        throw new Error('Invalid business data format');
    }

    async loadServices() {
        const response = await fetch(`${this.apiUrl}/api/tasks/${this.businessSlug}/services`);
        const data = await response.json();
        
        if (data.services && data.services.success && data.services.results) {
            return data.services.results.filter(service => !service.isHiddenFromCustomers);
        }
        throw new Error('Invalid services data format');
    }

    async loadCustomQuestions() {
        const response = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${this.businessSlug}/customQuestions`);
        
        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        if (data.success && data.results) {
            return data.results.map(question => ({
                ...question,
                isRequired: question.isRequired || false
            }));
        }
        return [];
    }

    async loadStaffAvailability(staffIds, startDateTime, endDateTime) {
        const response = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${this.businessSlug}/staffAvailability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                staffIds,
                startDateTime,
                endDateTime
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.success ? data.results : [];
    }

    async createAppointment(appointmentData) {
        const response = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${this.businessSlug}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData)
        });

        const result = await response.json();
        return { response, result };
    }
}