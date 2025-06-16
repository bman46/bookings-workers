import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

export class BookingDatePicker extends LitElement {
  @property({ type: Array }) businessHours: any[] = [];
  @property({ type: String }) timeZone = '';
  @state() selectedDate = '';

  static styles = css`
    .label {
      font-weight: 500;
      margin-bottom: 8px;
      font-size: 1.04rem;
    }
    .days { display: flex; gap: 8px; margin-bottom: 8px; }
    .day { /* ...your day styles... */ }
    .day.active { /* ...active styles... */ }
    .day.disabled { /* ...disabled styles... */ }
  `;

  selectDate(date: string) {
    this.selectedDate = date;
    this.dispatchEvent(new CustomEvent('date-selected', { detail: { date }, bubbles: true, composed: true }));
  }

  render() {
    // Example: show next 5 business days
    const days = this.businessHours
      .filter(d => d.timeSlots && d.timeSlots.length)
      .map((d, i) => {
        const today = new Date();
        const offset = (i + 1) - today.getDay();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
        const dateStr = date.toISOString().slice(0, 10);
        return {
          label: d.day.charAt(0).toUpperCase() + d.day.slice(1, 3),
          date: dateStr,
          active: this.selectedDate === dateStr,
        };
      });

    return html`
      <div class="label">Monday, June 16</div>
      <div class="days">
        ${days.map(d => html`
          <button class="day ${d.active ? 'active' : ''}"
            @click=${() => this.selectDate(d.date)}>
            <span class="label">${d.label}</span>
            <span class="date">${new Date(d.date).getDate()}</span>
          </button>
        `)}
      </div>
    `;
  }
}
customElements.define('booking-date-picker', BookingDatePicker);