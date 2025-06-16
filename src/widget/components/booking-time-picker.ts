import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import './booking-time-slot';

// Define types for better type safety
interface AvailabilityItem {
  startDateTime?: { time: string };
}
interface StaffAvailability {
  availabilityItems?: AvailabilityItem[];
}

export class BookingTimePicker extends LitElement {
  @property({ type: Array }) availability: StaffAvailability[] = [];

  static styles = css`
    .section { margin-bottom: 18px; }
    .label { font-size: 0.98rem; color: #666; margin-bottom: 6px; font-weight: 500; }
  `;

  getTimeSlots(period: 'morning' | 'afternoon') {
    if (!this.availability?.length) return [];
    const slots = this.availability.flatMap(staff =>
      staff.availabilityItems?.map((item: AvailabilityItem) => item.startDateTime?.time) || []
    ).filter((t): t is string => typeof t === 'string' && !!t);
    return slots.filter(t => {
      const hour = parseInt(t.split(':')[0], 10);
      return period === 'morning' ? hour < 12 : hour >= 12;
    });
  }

  render() {
    return html`
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
customElements.define('booking-time-picker', BookingTimePicker);