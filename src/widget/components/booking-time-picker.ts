import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import './booking-time-slot';
import { getBookableSlots } from '../utils/slots';

export class BookingTimePicker extends LitElement {
  @property({ type: Array }) availability: any[] = [];
  @property({ type: Array }) businessHours: any[] = [];
  @property({ type: String }) timeZone = '';
  @property({ type: Number }) slotDuration = 15; // default to 15 minutes
  @property({ type: String }) selectedDate = ''; // 'YYYY-MM-DD'
  @property({ type: Object }) maximumAdvanceDate = new Date(); // Add this property
  @property({ type: String }) minimumLeadTime = ''; // Add this property

  static styles = css`
    .section { margin-bottom: 18px; }
    .label { font-size: 0.98rem; color: #666; margin-bottom: 6px; font-weight: 500; }
  `;

  getSlots(period: 'morning' | 'afternoon') {
    if (!this.selectedDate) {
      return [];
    }

    // Check if selected date is beyond maximum advance time
    const selectedDateObj = new Date(this.selectedDate);
    if (selectedDateObj > this.maximumAdvanceDate) {
      return []; // Return no slots if beyond advance limit
    }
    
    const allSlots = getBookableSlots(
      this.availability,
      this.slotDuration,
      this.selectedDate,
      this.businessHours,
      this.minimumLeadTime
    );
    
    const filteredSlots = allSlots.filter(slot => {
      // Parse the 12-hour format time
      const timeStr = slot.time; // e.g., "9:00 AM" or "2:30 PM"
      const isPM = timeStr.includes('PM');
      const isAM = timeStr.includes('AM');
      const [timeOnly] = timeStr.split(' '); // Get "9:00" part
      const [hoursStr] = timeOnly.split(':');
      let hours = parseInt(hoursStr, 10);
      
      // Convert to 24-hour for comparison
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      }
      
      return period === 'morning' ? hours < 12 : hours >= 12;
    });
    
    return filteredSlots;
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