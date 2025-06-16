import { LitElement, html, css } from 'lit';
const days = [
    { label: 'Mon', date: 16, active: true },
    { label: 'Tue', date: 17 },
    { label: 'Wed', date: 18 },
    { label: 'Thu', date: 19 },
    { label: 'Fri', date: 20 },
    { label: 'Sat', date: 21, disabled: true },
    { label: 'Sun', date: 22, disabled: true },
];
export class BookingDaySelector extends LitElement {
    render() {
        return html `
      <div class="days">
        ${days.map(d => html `
            <button
              class="day ${d.active ? 'active' : ''} ${d.disabled ? 'disabled' : ''}"
              ?disabled=${d.disabled}
            >
              <span class="label">${d.label}</span>
              <span class="date">${d.date}</span>
            </button>
          `)}
      </div>
    `;
    }
}
BookingDaySelector.styles = css `
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
    .label {
      font-size: 0.93rem;
    }
    .date {
      font-size: 1.08rem;
      font-weight: 600;
    }
  `;
customElements.define('booking-day-selector', BookingDaySelector);
//# sourceMappingURL=booking-day-selector.js.map