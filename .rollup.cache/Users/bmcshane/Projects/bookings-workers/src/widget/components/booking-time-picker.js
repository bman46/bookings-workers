import { __decorate } from "tslib";
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import './booking-time-slot';
export class BookingTimePicker extends LitElement {
    constructor() {
        super(...arguments);
        this.availability = [];
    }
    getTimeSlots(period) {
        if (!this.availability?.length)
            return [];
        const slots = this.availability.flatMap(staff => staff.availabilityItems?.map((item) => item.startDateTime?.time) || []).filter((t) => typeof t === 'string' && !!t);
        return slots.filter(t => {
            const hour = parseInt(t.split(':')[0], 10);
            return period === 'morning' ? hour < 12 : hour >= 12;
        });
    }
    render() {
        return html `
      <div class="section">
        <div class="label">Morning</div>
        <booking-time-slot .times=${this.getTimeSlots('morning')}></booking-time-slot>
      </div>
      <div class="section">
        <div class="label">Afternoon</div>
        <booking-time-slot .times=${this.getTimeSlots('afternoon')}></booking-time-slot>
      </div>
    `;
    }
}
BookingTimePicker.styles = css `
    .section { margin-bottom: 18px; }
    .label { font-size: 0.98rem; color: #666; margin-bottom: 6px; font-weight: 500; }
  `;
__decorate([
    property({ type: Array })
], BookingTimePicker.prototype, "availability", void 0);
customElements.define('booking-time-picker', BookingTimePicker);
//# sourceMappingURL=booking-time-picker.js.map