import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import './booking-service-info';
import './booking-date-picker';
import './booking-time-picker';
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
      minimumLeadTime // Pass minimum lead time
    );
  }

  findAvailableDateInWeek(weekStart: Date): string | null {
    if (!this.availability || !this.business?.businessHours) return null;

    const slotDuration = parseISODuration(this.selectedService?.defaultDuration || 'PT15M').value;
    const maxAdvanceDate = this.getMaximumAdvanceDate();
    const minimumLeadTime = this.selectedService?.schedulingPolicy?.minimumLeadTime;
    const today = new Date();
    const now = new Date();

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

      // Check if there are available slots for this day
      const slots = getBookableSlots(
        this.availability,
        slotDuration,
        dateStr,
        this.business?.businessHours || [],
        minimumLeadTime // Pass minimum lead time here too
      );
      
      // For today, filter out past time slots
      let availableSlots = slots.filter((slot: any) => slot.available);
      
      if (date.toDateString() === today.toDateString()) {
        // Filter out past time slots for today
        availableSlots = availableSlots.filter((slot: any) => {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotTime = new Date(date);
          slotTime.setHours(hours, minutes, 0, 0);
          return slotTime > now;
        });
      }
      
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

  render() {
    if (this.loading) return html`<div class="card">Loading...</div>`;
    if (this.error) return html`<div class="card">${this.error}</div>`;

    return html`
      <div class="card">
        <booking-service-info
          .business=${this.business}
          .services=${[this.selectedService]}
          .icon=${this.icon}>
        </booking-service-info>
        <hr />
        <booking-date-picker
          .businessHours=${this.business?.businessHours || []}
          .availability=${this.availability}
          .slotDuration=${parseISODuration(this.selectedService?.defaultDuration || 'PT15M').value}
          .timeZone=${this.business?.bookingPageSettings?.businessTimeZone || ''}
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
          .minimumLeadTime=${this.selectedService?.schedulingPolicy?.minimumLeadTime || ''}>
        </booking-time-picker>
      </div>
    `;
  }
}
customElements.define('booking-card', BookingCard);