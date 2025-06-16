import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { parseISODuration } from '../utils/isoDuration.js';

export class BookingServiceInfo extends LitElement {
  @property({ type: Object }) business: any = null;
  @property({ type: Array }) services: any[] = [];
  @property({ type: String }) icon: string = '';

  static styles = css`
    .info {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 8px;
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      flex-shrink: 0;
    }
    .details {
      flex: 1;
      min-width: 0;
    }
    .title {
      font-weight: 600;
      font-size: 1.18rem;
      margin-bottom: 2px;
      line-height: 1.2;
    }
    .desc {
      color: #555;
      font-size: 0.98rem;
      margin: 4px 0 10px 0;
      line-height: 1.4;
    }
    .meta {
      color: #222;
      font-size: 1rem;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .meta span {
      color: #888;
      margin-left: 0;
    }
  `;

  renderAvatar() {
    // If icon is a URL, use <img>. If it's an emoji, render as text.
    if (this.icon && (this.icon.startsWith('http://') || this.icon.startsWith('https://'))) {
      return html`<img class="avatar" src="${this.icon}" alt="Service" />`;
    } else if (this.icon) {
      return html`<div class="avatar emoji">${this.icon}</div>`;
    }
    // fallback
    return html`<div class="avatar emoji">💇‍♂️</div>`;
  }

  render() {
    if (!this.business) return html``;
    const service = this.services[0] || {};
    const durationObj = parseISODuration(service.defaultDuration || 'PT0M');
    let durationStr = '--';
    if (durationObj.value > 0) {
      durationStr = `${durationObj.value} ${durationObj.unit}`;
    }
    return html`
      <div class="info">
        ${this.renderAvatar()}
        <div class="details">
          <div class="title">${service.displayName || 'Service'}</div>
          <div class="desc">${service.description || 'No description.'}</div>
          <div class="meta">
            <span>$${service.defaultPrice ?? '--'}</span>
            <span>· ${durationStr}</span>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('booking-service-info', BookingServiceInfo);