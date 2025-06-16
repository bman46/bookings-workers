import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import './booking-service-info';
import './booking-date-picker';
import './booking-time-picker';
import { parseISODuration } from '../utils/isoDuration';

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

  async fetchAll() {
    this.loading = true;
    this.error = '';
    try {
      // 1. Fetch business info
      const businessRes = await fetch(`${this.apiUrl}/api/tasks/${encodeURIComponent(this.bookingsId)}`);
      const businessJson = await businessRes.json();
      this.business = businessJson.result?.task;

      // 2. Fetch services (updated for new API structure)
      const servicesRes = await fetch(`${this.apiUrl}/api/tasks/${encodeURIComponent(this.bookingsId)}/services`);
      const servicesJson = await servicesRes.json();
      this.services = servicesJson.services?.results || [];

      // Select the service by displayName (case-insensitive)
      this.selectedService = this.services.find(
        (s: any) => s.displayName?.toLowerCase() === this.serviceDisplayName?.toLowerCase()
      ) || this.services[0];

      // Extract staff IDs from the selected service only
      const staffIds: string[] = Array.isArray(this.selectedService?.staffMemberIds)
        ? this.selectedService.staffMemberIds
        : [];

      // 3. Fetch availability for selected service's staff (example: fetch for today)
      const timeZone = this.business?.bookingPageSettings?.businessTimeZone || 'UTC';
      const today = new Date();
      const startDateTime = {
        dateTime: today.toISOString(),
        timeZone
      };
      const endDateTime = {
        dateTime: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        timeZone
      };

      const availRes = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${encodeURIComponent(this.bookingsId)}/staffAvailability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIds, startDateTime, endDateTime }),
      });
      const availJson = await availRes.json();
      this.availability = availJson.results || [];
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
          .timeZone=${this.business?.bookingPageSettings?.businessTimeZone || ''}
          .selectedDate=${this.selectedDate}
          @date-selected=${(e: CustomEvent) => { this.selectedDate = e.detail.date; }}>
        </booking-date-picker>
        <booking-time-picker
          .availability=${this.availability}
          .businessHours=${this.business?.businessHours || []}
          .timeZone=${this.business?.bookingPageSettings?.businessTimeZone || ''}
          .slotDuration=${parseISODuration(this.selectedService?.defaultDuration || 'PT15M')}
          .selectedDate=${this.selectedDate}>
        </booking-time-picker>
      </div>
    `;
  }
}
customElements.define('booking-card', BookingCard);