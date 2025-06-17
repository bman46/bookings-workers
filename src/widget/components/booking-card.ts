import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import './booking-service-info';
import './booking-date-picker';
import './booking-time-picker';
import './booking-form'; // Import the booking form component
import './booking-confirmation'; // Import the confirmation component
import { parseISODuration } from '../utils/isoDuration';
import { getBookableSlots } from '../utils/slots';

export class BookingCard extends LitElement {
  @property({ type: String, attribute: 'api-url' }) apiUrl = '';
  @property({ type: String, attribute: 'bookings-id' }) bookingsId = '';
  @property({ type: String, attribute: 'service-displayname' }) serviceDisplayName = '';
  @property({ type: String }) icon = '';

  @state() business: any = null;
  @state() services: any[] = [];
  @state() selectedService: any = null;
  @state() availability: any = null;
  @state() loading = true;
  @state() error = '';
  @state() selectedDate: string = '';
  @state() currentWeekStart = new Date(); // Track current week
  @state() showBookingForm = false; // Add this state property
  @state() selectedTimestamp = ''; // Change from selectedTime to selectedTimestamp
  @state() selectedStaffIds: string[] = []; // Add staff IDs property
  @state() showConfirmation = false; // Add confirmation state
  @state() confirmationData: any = null; // Store confirmation data

  static styles = css`
    .card {
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 24px;
      background: #fff;
      max-width: 420px;
      margin: 0 auto;
      font-family: system-ui, sans-serif;
    }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 24px 0;
    }
    
    /* Loading screen styles */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 200px;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f0f0;
      border-top: 3px solid #1769ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-text {
      color: #666;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .loading-subtext {
      color: #888;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    
    /* Skeleton loading for content areas */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    .skeleton-service {
      height: 80px;
      margin-bottom: 24px;
    }
    
    .skeleton-calendar {
      height: 120px;
      margin-bottom: 16px;
    }
    
    .skeleton-times {
      height: 100px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchAll();
  }

  async fetchAvailability(weekStart?: string, weekEnd?: string) {
    if (!this.selectedService || !this.business) return;

    const staffIds: string[] = Array.isArray(this.selectedService?.staffMemberIds)
      ? this.selectedService.staffMemberIds
      : [];

    const timeZone = this.business?.bookingPageSettings?.businessTimeZone || 'UTC';
    
    // Use provided dates or default to current week
    const start = weekStart ? new Date(weekStart) : new Date(this.currentWeekStart);
    const end = weekEnd ? new Date(weekEnd) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const startDateTime = {
      dateTime: start.toISOString(),
      timeZone
    };
    const endDateTime = {
      dateTime: end.toISOString(),
      timeZone
    };

    try {
      const availRes = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${encodeURIComponent(this.bookingsId)}/staffAvailability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIds, startDateTime, endDateTime }),
      });
      const availJson = await availRes.json();
      this.availability = availJson.results || [];

      // After fetching availability, find the nearest available date if none selected
      // Force re-selection even if a date was previously selected to ensure accuracy
      await this.selectNearestAvailableDate();
    } catch (e) {
      console.error('Failed to fetch availability:', e);
    }
  }

  getMaximumAdvanceDate(): Date {
    // Get maximum advance from the selected service's scheduling policy
    const maxAdvanceISO = this.selectedService?.schedulingPolicy?.maximumAdvance || 'P60D'; // Default 60 days
    const maxAdvanceDays = parseISODuration(maxAdvanceISO).value; // Convert P10D to 10 (days)
    
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxAdvanceDays);
    return maxDate;
  }

  async selectNearestAvailableDate() {
    // Get maximum advance from the selected service
    const maxAdvanceISO = this.selectedService?.schedulingPolicy?.maximumAdvance || 'P60D';
    const maxAdvanceDays = parseISODuration(maxAdvanceISO).value;
    
    const today = new Date();
    
    // Check current week first
    let availableDate = this.findAvailableDateInWeek(this.currentWeekStart);
    
    if (availableDate) {
      this.selectedDate = availableDate;
      return;
    }

    // If no available date in current week, check subsequent weeks
    let weekStart = new Date(this.currentWeekStart);
    let daysChecked = 0;

    while (daysChecked < maxAdvanceDays) {
      // Move to next week
      weekStart.setDate(weekStart.getDate() + 7);
      daysChecked += 7;

      // Fetch availability for this week
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      await this.fetchAvailabilityForWeek(weekStart, weekEnd);

      // Check if any date in this week is available
      availableDate = this.findAvailableDateInWeek(weekStart);
      
      if (availableDate) {
        // Update current week and select the date
        this.currentWeekStart = new Date(weekStart);
        this.selectedDate = availableDate;
        return;
      }
    }

    // If no available dates found within maximum advance time
    this.error = 'No available appointments found within the booking window.';
  }

  async fetchAvailabilityForWeek(weekStart: Date, weekEnd: Date) {
    if (!this.selectedService || !this.business) return;

    const staffIds: string[] = Array.isArray(this.selectedService?.staffMemberIds)
      ? this.selectedService.staffMemberIds
      : [];

    const timeZone = this.business?.bookingPageSettings?.businessTimeZone || 'UTC';
    
    const startDateTime = {
      dateTime: weekStart.toISOString(),
      timeZone
    };
    const endDateTime = {
      dateTime: weekEnd.toISOString(),
      timeZone
    };

    try {
      const availRes = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${encodeURIComponent(this.bookingsId)}/staffAvailability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIds, startDateTime, endDateTime }),
      });
      const availJson = await availRes.json();
      this.availability = availJson.results || [];
    } catch (e) {
      console.error('Failed to fetch availability for week:', e);
    }
  }

  isWeekWithinAdvanceLimit(weekStart: Date): boolean {
    const maxAdvanceDate = this.getMaximumAdvanceDate();
    // Check if the start of the week is within the advance limit
    return weekStart <= maxAdvanceDate;
  }

  getBookableSlotsForDate(date: string, slotDuration: number) {
    const minimumLeadTime = this.selectedService?.schedulingPolicy?.minimumLeadTime;
    
    return getBookableSlots(
      this.availability,
      slotDuration,
      date,
      this.business?.businessHours || [],
      minimumLeadTime
    );
  }

  findAvailableDateInWeek(weekStart: Date): string | null {
    if (!this.availability || !this.business?.businessHours) return null;

    const slotDuration = parseISODuration(this.selectedService?.defaultDuration || 'PT15M').value;
    const maxAdvanceDate = this.getMaximumAdvanceDate();
    const minimumLeadTime = this.selectedService?.schedulingPolicy?.minimumLeadTime;
    const today = new Date();

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      // Skip past dates (but allow today)
      if (date < today && date.toDateString() !== today.toDateString()) continue;
      
      // Skip dates beyond maximum advance time
      if (date > maxAdvanceDate) continue;
      const dateStr = date.toISOString().slice(0, 10);
      
      // Check if this day has business hours
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const hasBusinessHours = this.business.businessHours.some(
        (d: any) => d.day.toLowerCase() === dayOfWeek && d.timeSlots?.length > 0
      );

      if (!hasBusinessHours) continue;

      // Get bookable slots - getBookableSlots already handles past time filtering
      const slots = getBookableSlots(
        this.availability,
        slotDuration,
        dateStr,
        this.business?.businessHours || [],
        minimumLeadTime
      );
      
      // Filter out unavailable time slots
      const availableSlots = slots.filter((slot: any) => slot.available);

      if (availableSlots.length > 0) {
        return dateStr;
      }
    }

    return null;
  }

  async fetchAll() {
    try {
      // 1. Fetch business info
      const businessRes = await fetch(`${this.apiUrl}/api/tasks/${encodeURIComponent(this.bookingsId)}`);
      const businessJson = await businessRes.json();
      this.business = businessJson.result?.task;

      // 2. Fetch services
      const servicesRes = await fetch(`${this.apiUrl}/api/tasks/${encodeURIComponent(this.bookingsId)}/services`);
      const servicesJson = await servicesRes.json();
      this.services = servicesJson.services?.results || [];

      // Select the service by displayName
      this.selectedService = this.services.find(
        (s: any) => s.displayName?.toLowerCase() === this.serviceDisplayName?.toLowerCase()
      ) || this.services[0];

      // 3. Set current week to start from today
      const today = new Date();
      this.currentWeekStart = new Date(today);
      this.currentWeekStart.setHours(0, 0, 0, 0);

      // 4. Fetch initial availability and auto-select nearest available date
      await this.fetchAvailability();

    } catch (e) {
      this.error = 'Failed to load booking data.';
    }
    this.loading = false;
  }

  // Update event handler to use timestamp and staff
  handleTimeSelected(e: CustomEvent) {
    this.selectedTimestamp = e.detail.timestamp;
    this.selectedStaffIds = e.detail.staffIds || []; // Store selected staff
    this.showBookingForm = true;
  }

  // Update method to clear timestamp
  handleChangeAppointment() {
    this.showBookingForm = false;
    this.selectedTimestamp = '';
  }

  // Add the missing booking confirmed handler
  handleBookingConfirmed(e: CustomEvent) {
    // Handle successful booking - show confirmation screen
    console.log('Booking confirmed:', e.detail);
    
    // Store confirmation data
    this.confirmationData = e.detail;
    
    // Show confirmation screen
    this.showBookingForm = false;
    this.showConfirmation = true;
  }

  // Handle when user clicks "Done" on confirmation screen
  handleBookingDone() {
    // Reset all states to start over
    this.showConfirmation = false;
    this.showBookingForm = false;
    this.selectedTimestamp = '';
    this.selectedStaffIds = [];
    this.confirmationData = null;
    
    // Optionally refresh availability
    this.fetchAvailability();
  }

  render() {
    if (this.showConfirmation && this.confirmationData) {
      // Show confirmation screen
      return html`
        <div class="card">
          <booking-confirmation
            .appointmentData=${this.confirmationData.appointmentData}
            .result=${this.confirmationData.result}
            .customerName=${this.confirmationData.customer.name}
            .customerEmail=${this.confirmationData.customer.email}
            @booking-done=${this.handleBookingDone}>
          </booking-confirmation>
        </div>
      `;
    }

    if (this.showBookingForm && this.selectedTimestamp) {
      // Show booking form with service info at top
      return html`
        <div class="card">
          <booking-service-info
            .business=${this.business}
            .services=${[this.selectedService]}
            .icon=${this.icon}>
          </booking-service-info>
          <hr />
          <booking-form
            .selectedService=${this.selectedService}
            .selectedTimestamp=${this.selectedTimestamp}
            .selectedStaffIds=${this.selectedStaffIds || []}
            .businessName=${this.business?.displayName || ''}
            .apiUrl=${this.apiUrl}
            .bookingsId=${this.bookingsId}
            @booking-confirmed=${this.handleBookingConfirmed}
            @change-appointment=${this.handleChangeAppointment}>
          </booking-form>
        </div>
      `;
    }

    if (this.loading) {
      return html`
        <div class="card">
          <div class="loading">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading booking options</div>
            <div class="loading-subtext">Please wait while we fetch available appointments...</div>
          </div>
        </div>
      `;
    }
    
    if (this.error) return html`<div class="card">${this.error}</div>`;

    return html`
      <div class="card">
        <booking-service-info
          .business=${this.business}
          .services=${[this.selectedService]}
          .icon=${this.icon}>
        </booking-service-info>
        <hr />
        <div class="booking-container">
          <booking-date-picker
            .businessHours=${this.business?.businessHours || []}
            .availability=${this.availability}
            .timeZone=${this.business?.bookingPageSettings?.businessTimeZone || ''}
            .slotDuration=${parseISODuration(this.selectedService?.defaultDuration || 'PT15M').value}
            .selectedDate=${this.selectedDate}
            .currentWeekStart=${this.currentWeekStart}
            .maximumAdvanceDate=${this.getMaximumAdvanceDate()}
            .minimumLeadTime=${this.selectedService?.schedulingPolicy?.minimumLeadTime || ''}
            @date-selected=${(e: CustomEvent) => { 
              this.selectedDate = e.detail.date; 
            }}
            @week-changed=${(e: CustomEvent) => {
              this.currentWeekStart = new Date(e.detail.weekStart);
              this.fetchAvailability(e.detail.weekStart, e.detail.weekEnd);
            }}>
          </booking-date-picker>
          <booking-time-picker
            .availability=${this.availability}
            .businessHours=${this.business?.businessHours || []}
            .timeZone=${this.business?.bookingPageSettings?.businessTimeZone || ''}
            .slotDuration=${parseISODuration(this.selectedService?.defaultDuration || 'PT15M').value}
            .selectedDate=${this.selectedDate}
            .maximumAdvanceDate=${this.getMaximumAdvanceDate()}
            .minimumLeadTime=${this.selectedService?.schedulingPolicy?.minimumLeadTime || ''}
            @time-selected=${this.handleTimeSelected}>
          </booking-time-picker>
        </div>
      </div>
    `;
  }
}
customElements.define('booking-card', BookingCard);