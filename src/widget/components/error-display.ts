import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

export class ErrorDisplay extends LitElement {
  @property({ type: String }) title = 'Error';
  @property({ type: String }) message = '';
  @property({ type: Boolean }) isRetrying = false;
  @property({ type: Number }) retryCount = 0;
  @property({ type: Number }) maxRetries = 3;
  @property({ type: Boolean }) showRetryButton = true;
  @property({ type: Boolean }) showResetButton = false;
  @property({ type: String }) retryButtonText = 'Try Again';
  @property({ type: String }) resetButtonText = 'Reset & Retry';

  static styles = css`
    .error-container {
      padding: 24px;
      text-align: center;
      background: #fff5f5;
      border: 1px solid #fed7d7;
      border-radius: 8px;
      margin: 16px 0;
    }
    
    .error-title {
      color: #c53030;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 8px;
    }
    
    .error-message {
      color: #742a2a;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    
    .error-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .retry-button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      background: #3182ce;
      color: white;
    }
    
    .retry-button:hover:not(:disabled) {
      background: #2c5aa0;
    }
    
    .retry-button:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }
    
    .retry-info {
      font-size: 0.9rem;
      color: #718096;
      margin-top: 8px;
    }
  `;

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('retry', {
      bubbles: true,
      composed: true
    }));
  }

  private handleReset() {
    this.dispatchEvent(new CustomEvent('reset', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const canRetry = this.retryCount < this.maxRetries;
    
    return html`
      <div class="error-container">
        <div class="error-title">
          ${this.isRetrying ? 'Retrying...' : this.title}
        </div>
        <div class="error-message">
          ${this.message}
        </div>
        ${this.showRetryButton ? html`
          <div class="error-actions">
            ${canRetry ? html`
              <button 
                class="retry-button" 
                @click=${this.handleRetry}
                ?disabled=${this.isRetrying}>
                ${this.isRetrying ? 'Retrying...' : this.retryButtonText}
              </button>
            ` : this.showResetButton ? html`
              <button class="retry-button" @click=${this.handleReset}>
                ${this.resetButtonText}
              </button>
            ` : ''}
          </div>
        ` : ''}
        ${this.showRetryButton ? html`
          <div class="retry-info">
            ${canRetry ? html`
              Attempt ${this.retryCount} of ${this.maxRetries}
            ` : html`
              Maximum retry attempts reached. ${this.showResetButton ? 'You can reset and try again.' : ''}
            `}
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('error-display', ErrorDisplay);