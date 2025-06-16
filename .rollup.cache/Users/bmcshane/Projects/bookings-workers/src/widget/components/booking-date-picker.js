import { LitElement, html, css } from 'lit';
import './booking-day-selector';
export class BookingDatePicker extends LitElement {
    render() {
        return html `
      <div class="label">Monday, June 16</div>
      <booking-day-selector></booking-day-selector>
    `;
    }
}
BookingDatePicker.styles = css `
    .label {
      font-weight: 500;
      margin-bottom: 8px;
      font-size: 1.04rem;
    }
  `;
customElements.define('booking-date-picker', BookingDatePicker);
//# sourceMappingURL=booking-date-picker.js.map