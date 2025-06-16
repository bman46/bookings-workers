import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import './booking-time-slot';
import { getBookableSlots } from '../utils/slots.js';

export class BookingTimePicker extends LitElement {
  @property({ type: Array }) availability: any[] = [];
  @property({ type: Array }) businessHours: any[] = [];
  @property({ type: String }) timeZone = '';
  @property({ type: Number }) slotDuration = 15; // default to 15 minutes
  @property({ type: String }) selectedDate = ''; // 'YYYY-MM-DD'

  static styles = css`
    .section { margin-bottom: 18px; }
    .label { font-size: 0.98rem; color: #666; margin-bottom: 6px; font-weight: 500; }
  `;

  getSlots(period: 'morning' | 'afternoon') {
    if (!this.selectedDate) return [];
    const allSlots = getBookableSlots(this.availability, this.slotDuration, this.selectedDate);
    return allSlots.filter(t => {
      const hour = parseInt(t.split(':')[0], 10);
      return period === 'morning' ? hour < 12 : hour >= 12;
    });
  }

  render() {
    return html`
      <div class="section">
        <div class="label">Morning</div>
        <booking-time-slot .times=${this.getSlots('morning')}></booking-time-slot>
      </div>
      <div class="section">
        <div class="label">Afternoon</div>
        <booking-time-slot .times=${this.getSlots('afternoon')}></booking-time-slot>
      </div>
    `;
  }
}
customElements.define('booking-time-picker', BookingTimePicker);