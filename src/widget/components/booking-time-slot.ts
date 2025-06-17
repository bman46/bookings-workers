import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

interface TimeSlot {
  time: string;
  available: boolean;
  staffIds?: string[]; // Add staff IDs to the interface
}

export class BookingTimeSlot extends LitElement {
  @property({ type: Array }) times: TimeSlot[] = [];
  @property({ type: String }) selectedTime = '';

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
    .slot.selected {
      background: #1769ff;
      color: #fff;
    }
  `;

  handleTimeClick(time: string) {
    console.log('Time slot clicked:', time);
    
    // Find the slot to get staff information
    const slot = this.times.find(s => s.time === time);
    
    this.dispatchEvent(new CustomEvent('time-selected', {
      detail: { 
        time,
        staffIds: slot?.staffIds || []
      },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="slots">
        ${this.times.map(
          slot => html`
            <button
              class="slot ${slot.time === this.selectedTime ? 'selected' : ''}"
              ?disabled=${!slot.available}
              @click=${() => slot.available && this.handleTimeClick(slot.time)}
            >
              ${slot.time}
            </button>
          `
        )}
      </div>
    `;
  }
}

customElements.define('booking-time-slot', BookingTimeSlot);