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
  @state() selectedTime = ''; // Store selected time

  static styles = css`
    .section { margin-bottom: 18px; }
    .label { font-size: 0.98rem; color: #666; margin-bottom: 6px; font-weight: 500; }
  `;

  private createSelectedDateTime(dateStr: string, timeStr: string): Date {
    // Parse the date (YYYY-MM-DD format)
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Parse the time (e.g., "9:30 AM" format)
    const isPM = timeStr.includes('PM');
    const isAM = timeStr.includes('AM');
    const [timeOnly] = timeStr.split(' ');
    const [hoursStr, minutesStr] = timeOnly.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    // Convert to 24-hour format
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    
    // Create the date object (month is 0-indexed in JavaScript Date)
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid date created:', date);
      // Fallback to current date
      return new Date();
    }
    
    return date;
  }

  handleTimeSelected(event: CustomEvent) {
    const time = event.detail?.time;
    if (!time) {
      console.error('No time in event detail:', event.detail);
      return;
    }
    
    this.selectedTime = time;
    
    // Check if selectedDate is available
    if (!this.selectedDate) {
      console.error('No selectedDate available for time selection');
      return;
    }
    
    // Create a proper timestamp from the selected date and time
    const selectedDateTime = this.createSelectedDateTime(this.selectedDate, time);
    const timestamp = selectedDateTime.toISOString();
    
    // Log the selected date and time
    console.log('Date and time selected:', {
      date: this.selectedDate,
      time: time,
      timestamp: timestamp
    });
    
    // Dispatch event to parent component
    this.dispatchEvent(new CustomEvent('time-selected', {
      detail: { 
        time,
        date: this.selectedDate,
        timestamp: timestamp
      },
      bubbles: true,
      composed: true
    }));
  }

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
        <booking-time-slot 
          .times=${this.getSlots('morning')}
          .selectedTime=${this.selectedTime}
          @time-selected=${(e: CustomEvent) => {
            e.stopPropagation(); // Prevent event from bubbling further
            this.handleTimeSelected(e);
          }}>
        </booking-time-slot>
      </div>
      <div class="section">
        <div class="label">Afternoon</div>
        <booking-time-slot 
          .times=${this.getSlots('afternoon')}
          .selectedTime=${this.selectedTime}
          @time-selected=${(e: CustomEvent) => {
            e.stopPropagation(); // Prevent event from bubbling further
            this.handleTimeSelected(e);
          }}>
        </booking-time-slot>
      </div>
    `;
  }
}
customElements.define('booking-time-picker', BookingTimePicker);