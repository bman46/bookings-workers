import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

export class BookingConfirmation extends LitElement {
  @property({ type: Object }) appointmentData: any = null;
  @property({ type: Object }) result: any = null;
  @property({ type: String }) customerName = '';
  @property({ type: String }) customerEmail = '';

  static styles = css`
    .confirmation-container {
      text-align: center;
      padding: 24px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      background: #4caf50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: white;
      font-size: 32px;
    }

    .confirmation-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .confirmation-subtitle {
      color: #666;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .appointment-details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: left;
      overflow-wrap: break-word;
    }

    .appointment-details h4 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      gap: 12px;
      flex-wrap: wrap;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 500;
      color: #666;
      flex-shrink: 0;
      min-width: 80px;
    }

    .detail-value {
      color: #333;
      font-weight: 500;
      text-align: right;
      word-break: break-word;
      overflow-wrap: break-word;
      flex: 1;
    }

    .email-notice {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      text-align: left;
    }

    .email-notice svg {
      width: 20px;
      height: 20px;
      color: #2196f3;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .email-notice-text {
      color: #1976d2;
      font-size: 0.9rem;
      line-height: 1.4;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .email-notice-text strong {
      word-break: break-all;
      overflow-wrap: break-word;
    }

    .location-section {
      margin-top: 24px;
    }

    .location-section h4 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      text-align: left;
    }

    .location-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      text-align: left;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .location-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .done-button {
      width: 100%;
      background: #4caf50;
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      margin-top: 24px;
      box-sizing: border-box;
    }

    .done-button:hover {
      background: #45a049;
    }

    /* Mobile-specific adjustments */
    @media (max-width: 480px) {
      .confirmation-container {
        padding: 16px;
      }
      
      .confirmation-title {
        font-size: 1.3rem;
      }
      
      .appointment-details {
        padding: 16px;
      }
      
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .detail-label {
        min-width: auto;
      }
      
      .detail-value {
        text-align: left;
        font-size: 0.95rem;
      }
      
      .email-notice {
        padding: 12px;
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      
      .email-notice svg {
        align-self: center;
        margin-top: 0;
      }
      
      .email-notice-text {
        font-size: 0.85rem;
      }
    }

    /* Very small screens */
    @media (max-width: 320px) {
      .confirmation-title {
        font-size: 1.2rem;
      }
      
      .detail-value {
        font-size: 0.9rem;
      }
      
      .email-notice-text {
        font-size: 0.8rem;
      }
    }
  `;

  private formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  }

  private handleDone() {
    this.dispatchEvent(new CustomEvent('booking-done', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.result) return html``;

    const appointmentTimestamp = this.appointmentData?.startDateTime?.dateTime + 'Z'; // Add Z for UTC

    return html`
      <div class="confirmation-container">
        <div class="success-icon">
          ✓
        </div>
        
        <h2 class="confirmation-title">Booking Confirmed!</h2>
        <p class="confirmation-subtitle">
          Your appointment has been successfully scheduled.<br>
          We look forward to seeing you!
        </p>

        <div class="appointment-details">
          <h4>Appointment Details</h4>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${this.formatDate(appointmentTimestamp)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${this.formatTime(appointmentTimestamp)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Customer:</span>
            <span class="detail-value">${this.customerName}</span>
          </div>
        </div>

        <div class="email-notice">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
          </svg>
          <div class="email-notice-text">
            A confirmation email has been sent to <strong>${this.customerEmail}</strong> with all the appointment details.
          </div>
        </div>

        <button class="done-button" @click=${this.handleDone}>
          Done
        </button>
      </div>
    `;
  }
}

customElements.define('booking-confirmation', BookingConfirmation);