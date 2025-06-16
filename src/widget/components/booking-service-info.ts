import {LitElement, html, css} from 'lit';

export class BookingServiceInfo extends LitElement {
  static styles = css`
    .info {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
      background: #ddd;
    }
    .details {
      flex: 1;
    }
    .title {
      font-weight: 600;
      font-size: 1.1rem;
    }
    .desc {
      color: #555;
      font-size: 0.97rem;
      margin: 4px 0 8px 0;
    }
    .meta {
      color: #222;
      font-size: 0.98rem;
    }
    .meta span {
      color: #888;
      margin-left: 8px;
    }
  `;

  render() {
    return html`
      <div class="info">
        <img class="avatar" src="https://placehold.co/56x56" alt="Service" />
        <div class="details">
          <div class="title">Men's Haircut</div>
          <div class="desc">
            Get a professional men's haircut tailored to your style preferences.
          </div>
          <div class="meta">
            $50 <span>· 30 minutes</span>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('booking-service-info', BookingServiceInfo);