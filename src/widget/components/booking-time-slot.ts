import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

interface TimeSlot {
  time: string;
  available: boolean;
}

export class BookingTimeSlot extends LitElement {
  @property({ type: Array }) times: TimeSlot[] = [];

  static styles = css`
    .slots {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 8px;
    }
    .slot {
      padding: 10px 16px;
      border-radius: 8px;
      background: #f5f5f5;
      color: #222;
      font-weight: 500;
      cursor: pointer;
      border: none;
      outline: none;
      font-size: 1rem;
      transition: background 0.15s;
    }
    .slot:hover:not([disabled]), .slot.selected:not([disabled]) {
      background: #1769ff;
      color: #fff;
    }
    .slot[disabled] {
      background: #f0f0f0;
      color: #bbb;
      cursor: not-allowed;
    }
  `;

  render() {
    return html`
      <div class="slots">
        ${this.times.map(
          t => html`
            <button
              class="slot"
              ?disabled=${!t.available}
              tabindex=${t.available ? 0 : -1}
            >${t.time}</button>
          `
        )}
      </div>
    `;
  }
}
customElements.define('booking-time-slot', BookingTimeSlot);