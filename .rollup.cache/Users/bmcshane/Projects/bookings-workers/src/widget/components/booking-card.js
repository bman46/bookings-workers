import { __decorate } from "tslib";
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import './booking-service-info';
import './booking-date-picker';
import './booking-time-picker';
export class BookingCard extends LitElement {
    constructor() {
        super(...arguments);
        this.apiUrl = '';
        this.bookingsId = '';
        this.serviceDisplayName = '';
        this.icon = '';
        this.business = null;
        this.services = [];
        this.selectedService = null;
        this.availability = null;
        this.loading = true;
        this.error = '';
    }
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
            this.selectedService = this.services.find((s) => s.displayName?.toLowerCase() === this.serviceDisplayName?.toLowerCase()) || this.services[0];
            // Extract staff IDs from the selected service only
            const staffIds = Array.isArray(this.selectedService?.staffMemberIds)
                ? this.selectedService.staffMemberIds
                : [];
            // 3. Fetch availability for selected service's staff (example: fetch for today)
            const today = new Date();
            const startDateTime = today.toISOString();
            const endDateTime = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
            const availRes = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${encodeURIComponent(this.bookingsId)}/staffAvailability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffIds, startDateTime, endDateTime }),
            });
            const availJson = await availRes.json();
            this.availability = availJson.results || [];
        }
        catch (e) {
            this.error = 'Failed to load booking data.';
        }
        this.loading = false;
    }
    render() {
        if (this.loading)
            return html `<div class="card">Loading...</div>`;
        if (this.error)
            return html `<div class="card">${this.error}</div>`;
        return html `
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
        ></booking-date-picker>
        <booking-time-picker
          .availability=${this.availability}
          .businessHours=${this.business?.businessHours || []}
          .timeZone=${this.business?.bookingPageSettings?.businessTimeZone || ''}
        ></booking-time-picker>
      </div>
    `;
    }
}
BookingCard.styles = css `
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
__decorate([
    property({ type: String, attribute: 'api-url' })
], BookingCard.prototype, "apiUrl", void 0);
__decorate([
    property({ type: String, attribute: 'bookings-id' })
], BookingCard.prototype, "bookingsId", void 0);
__decorate([
    property({ type: String, attribute: 'service-displayname' })
], BookingCard.prototype, "serviceDisplayName", void 0);
__decorate([
    property({ type: String })
], BookingCard.prototype, "icon", void 0);
__decorate([
    state()
], BookingCard.prototype, "business", void 0);
__decorate([
    state()
], BookingCard.prototype, "services", void 0);
__decorate([
    state()
], BookingCard.prototype, "selectedService", void 0);
__decorate([
    state()
], BookingCard.prototype, "availability", void 0);
__decorate([
    state()
], BookingCard.prototype, "loading", void 0);
__decorate([
    state()
], BookingCard.prototype, "error", void 0);
customElements.define('booking-card', BookingCard);
//# sourceMappingURL=booking-card.js.map