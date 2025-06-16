import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

export class BookingDatePicker extends LitElement {
  @property({ type: Array }) businessHours: any[] = [];
  @property({ type: String }) timeZone = '';
  @state() selectedDate = '';
  @state() currentWeekStart = new Date(); // Track current week's start

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

  connectedCallback() {
    super.connectedCallback();
    
    // Use the ACTUAL current date
    const today = new Date(); // This should be Monday, December 16, 2024
    console.log('Today is:', today.toDateString(), today.toLocaleDateString('en-US', { weekday: 'long' }));
    
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setHours(0, 0, 0, 0);
    
    // Auto-select today's date if none selected
    if (!this.selectedDate) {
      this.selectDate(today.toISOString().slice(0, 10));
    }
  }

  getWeekDays() {
    const days = [];
    
    // Start from the current day (not start of week)
    const startDate = new Date(this.currentWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Check if this day has business hours
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const hasBusinessHours = this.businessHours.some(
        d => d.day.toLowerCase() === dayOfWeek && d.timeSlots?.length > 0
      );

      days.push({
        date: dateStr,
        dayName,
        dayNumber: date.getDate(),
        isToday: dateStr === new Date().toISOString().slice(0, 10),
        isSelected: dateStr === this.selectedDate,
        isDisabled: !hasBusinessHours
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
    const canGoPrev = this.currentWeekStart >= today; // Can go back if not showing past dates

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