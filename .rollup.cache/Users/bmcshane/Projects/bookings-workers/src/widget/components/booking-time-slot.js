import { __decorate } from "tslib";
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
export class BookingTimeSlot extends LitElement {
    constructor() {
        super(...arguments);
        this.times = [];
    }
    render() {
        return html `
      <div class="slots">
        ${this.times.map(t => html `<button class="slot">${t}</button>`)}
      </div>
    `;
    }
}
BookingTimeSlot.styles = css `
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
    .slot:hover, .slot.selected {
      background: #1769ff;
      color: #fff;
    }
  `;
__decorate([
    property({ type: Array })
], BookingTimeSlot.prototype, "times", void 0);
customElements.define('booking-time-slot', BookingTimeSlot);
//# sourceMappingURL=booking-time-slot.js.map