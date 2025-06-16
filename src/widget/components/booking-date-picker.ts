import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getBookableSlots } from '../utils/slots';

export class BookingDatePicker extends LitElement {
  @property({ type: Array }) businessHours: any[] = [];
  @property({ type: Array }) availability: any[] = [];
  @property({ type: String }) timeZone = '';
  @property({ type: Number }) slotDuration = 15;
  @property({ type: Object }) currentWeekStart = new Date();
  @property({ type: Object }) maximumAdvanceDate = new Date();
  @property({ type: String }) minimumLeadTime = '';
  @state() selectedDate = '';

  static styles = css`
    .week-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .week-nav {
      display: flex;
      gap: 8px;
    }
    .nav-btn {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.15s;
    }
    .nav-btn:hover {
      background: #f5f5f5;
    }
    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .week-range {
      font-weight: 500;
      font-size: 1.04rem;
    }
    .days { 
      display: flex; 
      gap: 8px; 
      margin-bottom: 8px; 
    }
    .day {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 12px;
      border-radius: 8px;
      background: #f5f5f5;
      color: #222;
      font-weight: 500;
      cursor: pointer;
      min-width: 48px;
      border: none;
      outline: none;
      transition: background 0.15s;
      font-size: 1rem;
    }
    .day.active {
      background: #1769ff;
      color: #fff;
    }
    .day.disabled {
      background: #f0f0f0;
      color: #bbb;
      cursor: not-allowed;
    }
    .day-label {
      font-size: 0.85rem;
      margin-bottom: 2px;
    }
    .day-date {
      font-size: 1rem;
      font-weight: 600;
    }
  `;

  selectDate(date: string) {
    this.selectedDate = date;
    this.dispatchEvent(new CustomEvent('date-selected', { 
      detail: { date }, 
      bubbles: true, 
      composed: true 
    }));
  }

  navigateWeek(direction: 'prev' | 'next') {
    const newWeekStart = new Date(this.currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    
    // Don't allow navigation beyond maximum advance date
    if (direction === 'next' && newWeekStart > this.maximumAdvanceDate) {
      return; // Block navigation
    }
    
    this.currentWeekStart = newWeekStart;
    
    // Dispatch event to fetch new availability data
    this.dispatchEvent(new CustomEvent('week-changed', {
      detail: { 
        weekStart: newWeekStart.toISOString().slice(0, 10),
        weekEnd: new Date(newWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      },
      bubbles: true,
      composed: true
    }));
  }

  getWeekDays() {
    const days = [];
    const startDate = new Date(this.currentWeekStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Check if date is beyond maximum advance time
      const isBeyondAdvanceLimit = date > this.maximumAdvanceDate;
      
      // Check if date is in the past
      const isPastDate = date < today;
      
      // Check if this day has business hours
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const hasBusinessHours = this.businessHours.some(
        d => d.day.toLowerCase() === dayOfWeek && d.timeSlots?.length > 0
      );

      // Check if there are any available slots for this day (only if within limits)
      let hasAvailableSlots = false;
      if (hasBusinessHours && !isPastDate && !isBeyondAdvanceLimit) {
        const slotsForDay = getBookableSlots(
          this.availability,
          this.slotDuration,
          dateStr,
          this.businessHours,
          this.minimumLeadTime // Pass minimum lead time
        );
        
        let availableSlots = slotsForDay.filter(slot => slot.available);
        
        hasAvailableSlots = availableSlots.length > 0;
      }

      days.push({
        date: dateStr,
        dayName,
        dayNumber: date.getDate(),
        isToday: dateStr === new Date().toISOString().slice(0, 10),
        isSelected: dateStr === this.selectedDate,
        isDisabled: !hasBusinessHours || !hasAvailableSlots || isPastDate || isBeyondAdvanceLimit
      });
    }
    
    return days;
  }

  getWeekRange() {
    const start = new Date(this.currentWeekStart);
    const end = new Date(this.currentWeekStart);
    end.setDate(start.getDate() + 6);
    
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${startStr} - ${endStr}`;
  }

  render() {
    const weekDays = this.getWeekDays();
    const today = new Date();
    const canGoPrev = this.currentWeekStart > today;
    
    // Check if next week would exceed maximum advance date
    const nextWeekStart = new Date(this.currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const canGoNext = nextWeekStart <= this.maximumAdvanceDate;

    return html`
      <div class="week-header">
        <div class="week-range">${this.getWeekRange()}</div>
        <div class="week-nav">
          <button 
            class="nav-btn" 
            ?disabled=${!canGoPrev}
            @click=${() => this.navigateWeek('prev')}>
            ← Prev
          </button>
          <button 
            class="nav-btn" 
            ?disabled=${!canGoNext}
            @click=${() => this.navigateWeek('next')}>
            Next →
          </button>
        </div>
      </div>
      <div class="days">
        ${weekDays.map(day => html`
          <button 
            class="day ${day.isSelected ? 'active' : ''} ${day.isDisabled ? 'disabled' : ''}"
            ?disabled=${day.isDisabled}
            @click=${() => !day.isDisabled && this.selectDate(day.date)}>
            <span class="day-label">${day.dayName}</span>
            <span class="day-date">${day.dayNumber}</span>
          </button>
        `)}
      </div>
    `;
  }
}
customElements.define('booking-date-picker', BookingDatePicker);