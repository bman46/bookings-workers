import {LitElement, html, css} from 'lit';
import './booking-time-slot';

const morning = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM',
  '10:30 AM', '11:00 AM', '11:30 AM'
];
const afternoon = [
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM',
  '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

export class BookingTimePicker extends LitElement {
  static styles = css`
    .section {
      margin-bottom: 18px;
    }
    .label {
      font-size: 0.98rem;
      color: #666;
      margin-bottom: 6px;
      font-weight: 500;
    }
  `;

  render() {
    return html`
      <div class="section">
        <div class="label">Morning</div>
        <booking-time-slot .times=${morning}></booking-time-slot>
      </div>
      <div class="section">
        <div class="label">Afternoon</div>
        <booking-time-slot .times=${afternoon}></booking-time-slot>
      </div>
    `;
  }
}
customElements.define('booking-time-picker', BookingTimePicker);