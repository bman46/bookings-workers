import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { parseISODuration } from '../utils/isoDuration';

export class BookingForm extends LitElement {
  @property({ type: Object }) selectedService: any = null;
  @property({ type: String }) selectedTimestamp = '';
  @property({ type: String }) businessName = '';
  @property({ type: Array }) selectedStaffIds: string[] = []; // Add staff IDs property
  @property({ type: String }) apiUrl = ''; // Add API URL property
  @property({ type: String }) bookingsId = ''; // Add bookings ID property

  @state() customerName = '';
  @state() customerPhone = '';
  @state() customerEmail = '';
  @state() notes = '';
  @state() showNotes = false;
  @state() isSubmitting = false;
  @state() errors: { [key: string]: string } = {};

  static styles = css`
    .appointment-summary {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .appointment-summary h4 {
      margin: 0 0 8px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
    }

    .appointment-time {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .appointment-time svg {
      width: 16px;
      height: 16px;
      color: #666;
    }

    .appointment-time span {
      font-size: 0.95rem;
      color: #666;
    }

    .change-button {
      background: none;
      border: none;
      color: #1769ff;
      font-size: 0.9rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
      margin-top: 8px;
    }

    .change-button:hover {
      color: #0d47a1;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .form-section h4 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #333;
    }

    .required {
      color: #d32f2f;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #1769ff;
      box-shadow: 0 0 0 2px rgba(23, 105, 255, 0.1);
    }

    .form-group.error input,
    .form-group.error textarea {
      border-color: #d32f2f;
    }

    .error-message {
      color: #d32f2f;
      font-size: 0.85rem;
      margin-top: 4px;
    }

    .notes-section {
      margin-top: 16px;
    }

    .add-notes-button {
      background: none;
      border: none;
      color: #1769ff;
      font-size: 0.9rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }

    .add-notes-button:hover {
      color: #0d47a1;
    }

    .notes-textarea {
      margin-top: 12px;
    }

    .notes-textarea textarea {
      min-height: 80px;
      resize: vertical;
    }

    .submit-button {
      width: 100%;
      background: #1769ff;
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      margin-top: 8px;
    }

    .submit-button:hover:not(:disabled) {
      background: #0d47a1;
    }

    .submit-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  private formatDateTime(timestamp: string): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  }

  private formatAppointmentDate(timestamp: string): string {
    const appointmentDate = new Date(timestamp);
    const today = new Date();
    
    // Reset time to compare dates only
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    // Calculate the difference in days
    const timeDifference = appointmentDateOnly.getTime() - todayDateOnly.getTime();
    const dayDifference = Math.round(timeDifference / (1000 * 60 * 60 * 24));
    
    // Format the month and day
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric'
    };
    const monthDay = appointmentDateOnly.toLocaleDateString('en-US', options);
    
    if (dayDifference === 0) {
      return `Today, ${monthDay}`;
    } else if (dayDifference === 1) {
      return `Tomorrow, ${monthDay}`;
    }
    
    // For other days, show the full weekday format
    const fullOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    };
    
    return appointmentDateOnly.toLocaleDateString('en-US', fullOptions);
  }

  private validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Validate name - now required
    if (!this.customerName.trim()) {
      this.errors.name = 'Name is required';
      isValid = false;
    }

    // Validate phone - required
    if (!this.customerPhone.trim()) {
      this.errors.phone = 'Phone number is required';
      isValid = false;
    } else {
      // Basic phone validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = this.customerPhone.replace(/\s|-|\(|\)/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        this.errors.phone = 'Please enter a valid phone number';
        isValid = false;
      }
    }

    // Email - now required
    if (!this.customerEmail.trim()) {
      this.errors.email = 'Email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.customerEmail)) {
        this.errors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    this.requestUpdate();
    return isValid;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    try {
      // Calculate end time based on service duration
      const startDateTime = new Date(this.selectedTimestamp);
      const serviceDuration = this.selectedService?.defaultDuration || 'PT15M'; // Default 15 minutes
      
      // Parse ISO duration using the utility
      const duration = parseISODuration(serviceDuration);
      let durationMs = 0;
      
      switch (duration.unit) {
        case 'minutes':
          durationMs = duration.value * 60 * 1000;
          break;
        case 'hours':
          durationMs = duration.value * 60 * 60 * 1000;
          break;
        case 'days':
          durationMs = duration.value * 24 * 60 * 60 * 1000;
          break;
        case 'seconds':
          durationMs = duration.value * 1000;
          break;
        default:
          console.warn("Failing over to default");
          durationMs = 15 * 60 * 1000; // Default 15 minutes
      }
      
      const endDateTime = new Date(startDateTime.getTime() + durationMs);
      
      // Format dates for Microsoft Graph API
      const formatDateTime = (date: Date) => {
        return date.toISOString().slice(0, 19); // Remove timezone suffix
      };
      
      // Use UTC as time zone to match timestamps
      const timeZone = "UTC";
      
      // Build the appointment object matching the backend schema
      const appointmentData = {
        serviceId: this.selectedService?.id,
        staffMemberIds: this.selectedStaffIds.slice(0, 1), // Only use first staff ID
        startDateTime: {
          dateTime: formatDateTime(startDateTime),
          timeZone: timeZone
        },
        endDateTime: {
          dateTime: formatDateTime(endDateTime),
          timeZone: timeZone
        },
        isCustomerAllowedToManageBooking: true,
        optOutOfCustomerEmail: false,
        isSelfServiceEnabled: true,
        customerNotes: this.notes || "",
        serviceNotes: ("Customer note: "+this.notes) || "",
        customers: [
          {
            name: this.customerName,
            emailAddress: this.customerEmail,
            phone: this.customerPhone.replace(/\D/g, ''),
            customQuestionAnswers: [],
          }
        ]
      };

      console.log('Appointment data:', appointmentData);

      // Make actual API call to your worker endpoint
      const response = await fetch(`${this.apiUrl}/solutions/bookingBusinesses/${encodeURIComponent(this.bookingsId)}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Appointment created successfully:', result);

      // Dispatch booking confirmed event with both original and formatted data
      this.dispatchEvent(new CustomEvent('booking-confirmed', {
        detail: {
          appointmentData, // The formatted object for API
          result, // The response from the API
          service: this.selectedService,
          timestamp: this.selectedTimestamp,
          staffIds: this.selectedStaffIds,
          customer: {
            name: this.customerName,
            phone: this.customerPhone,
            email: this.customerEmail,
            notes: this.notes || null
          }
        },
        bubbles: true,
        composed: true
      }));

    } catch (error) {
      console.error('Booking failed:', error);
      
      // Handle the unknown error type properly
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show user-friendly error message
      alert(`Booking failed: ${errorMessage}`);
    } finally {
      this.isSubmitting = false;
    }
  }

  private handleChangeAppointment() {
    this.dispatchEvent(new CustomEvent('change-appointment', {
      bubbles: true,
      composed: true
    }));
  }

  private toggleNotes() {
    this.showNotes = !this.showNotes;
  }

  private formatPhoneNumber(value: string): string {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format based on length
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return value;
    
    const [, area, exchange, number] = match;
    
    if (number) {
      return `(${area}) ${exchange}-${number}`;
    } else if (exchange) {
      return `(${area}) ${exchange}`;
    } else if (area) {
      return area.length === 3 ? `(${area})` : area;
    }
    
    return cleaned;
  }

  private handlePhoneInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = this.customerPhone;
    
    // Only allow digits - remove any non-digit characters immediately
    const digitsOnly = input.value.replace(/\D/g, '');
    const newValue = this.formatPhoneNumber(digitsOnly);
    
    this.customerPhone = newValue;
    
    // Clear error if it exists
    if (this.errors.phone) delete this.errors.phone;
    
    // Adjust cursor position after formatting
    this.updateComplete.then(() => {
      const lengthDiff = newValue.length - oldValue.length;
      const newCursorPosition = cursorPosition + lengthDiff;
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    });
  }

  private handlePhoneKeydown(e: KeyboardEvent) {
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right arrow keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Allow special keys
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  render() {
    return html`
      <!-- Appointment Summary -->
      <div class="appointment-summary">
        <h4>${this.formatAppointmentDate(this.selectedTimestamp)}</h4>
        <div class="appointment-time">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z" />
          </svg>
          <span>${new Date(this.selectedTimestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          })}</span>
        </div>
        <button class="change-button" @click=${this.handleChangeAppointment}>
          Change
        </button>
      </div>

      <!-- Customer Details Form -->
      <form @submit=${this.handleSubmit}>
        <div class="form-section">
          <h4>Enter Details</h4>
          
          <div class="form-group ${this.errors.name ? 'error' : ''}">
            <label for="name">Name <span class="required">*</span></label>
            <input
              type="text"
              id="name"
              .value=${this.customerName}
              @input=${(e: Event) => {
                this.customerName = (e.target as HTMLInputElement).value;
                if (this.errors.name) delete this.errors.name;
              }}
              placeholder="Enter your name"
              ?disabled=${this.isSubmitting}
            />
            ${this.errors.name ? html`<div class="error-message">${this.errors.name}</div>` : ''}
          </div>

          <div class="form-group ${this.errors.phone ? 'error' : ''}">
            <label for="phone">Phone Number <span class="required">*</span></label>
            <input
              type="tel"
              id="phone"
              .value=${this.customerPhone}
              @input=${this.handlePhoneInput}
              @keydown=${this.handlePhoneKeydown}
              placeholder="(555) 123-4567"
              maxlength="14"
              ?disabled=${this.isSubmitting}
            />
            ${this.errors.phone ? html`<div class="error-message">${this.errors.phone}</div>` : ''}
          </div>

          <div class="form-group ${this.errors.email ? 'error' : ''}">
            <label for="email">Email <span class="required">*</span></label>
            <input
              type="email"
              id="email"
              .value=${this.customerEmail}
              @input=${(e: Event) => {
                this.customerEmail = (e.target as HTMLInputElement).value;
                if (this.errors.email) delete this.errors.email;
              }}
              placeholder="Enter your email address"
              ?disabled=${this.isSubmitting}
            />
            ${this.errors.email ? html`<div class="error-message">${this.errors.email}</div>` : ''}
          </div>

          <div class="notes-section">
            ${!this.showNotes ? html`
              <button type="button" class="add-notes-button" @click=${this.toggleNotes}>
                Add Notes
              </button>
            ` : html`
              <div class="form-group notes-textarea">
                <label for="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  .value=${this.notes}
                  @input=${(e: Event) => this.notes = (e.target as HTMLTextAreaElement).value}
                  placeholder="Any special requests or notes..."
                  ?disabled=${this.isSubmitting}
                ></textarea>
              </div>
            `}
          </div>
        </div>

        <button type="submit" class="submit-button" ?disabled=${this.isSubmitting}>
          ${this.isSubmitting ? html`<span class="loading-spinner"></span>` : ''}
          ${this.isSubmitting ? 'Confirming Booking...' : 'Confirm Booking'}
        </button>
      </form>
    `;
  }
}

customElements.define('booking-form', BookingForm);