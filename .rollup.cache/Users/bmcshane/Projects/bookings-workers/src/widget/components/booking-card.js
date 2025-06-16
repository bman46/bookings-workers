import { LitElement, html, css } from 'lit';
import './booking-service-info';
import './booking-date-picker';
import './booking-time-picker';
export class BookingCard extends LitElement {
    render() {
        return html `
      <div class="card">
        <booking-service-info></booking-service-info>
        <hr />
        <booking-date-picker></booking-date-picker>
        <booking-time-picker></booking-time-picker>
      </div>
    `;
    }
}
BookingCard.styles = css `
    .card {
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 24px;
      background: #fff;
      max-width: 420px;
      margin: 0 auto;
      font-family: system-ui, sans-serif;
    }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 24px 0;
    }
  `;
customElements.define('booking-card', BookingCard);
//# sourceMappingURL=booking-card.js.map