class BookingWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Initialize properties
        this.apiUrl = '';
        this.businessSlug = '';
        this.template = null;
        this.styles = null;
        
        // Data properties
        this.businessData = null;
        this.services = null;
        this.selectedService = null;
        this.selectedServiceData = null;
        this.selectedDateTime = null;
        this.customQuestions = [];
        
        // Helper classes (will be initialized after loading dependencies)
        this.api = null;
        this.scheduler = null;
        this.form = null;
        
        // Track if dependencies are loaded
        this.dependenciesLoaded = false;
    }

    static get observedAttributes() {
        return ['api-url', 'business-slug'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'api-url') {
            this.apiUrl = newValue;
        } else if (name === 'business-slug') {
            this.businessSlug = newValue;
        }
        
        // Re-initialize if dependencies are loaded and we have required attributes
        if (this.dependenciesLoaded && this.apiUrl && this.businessSlug) {
            this.initializeWidget();
        }
    }

    async connectedCallback() {
        this.apiUrl = this.getAttribute('api-url') || '';
        this.businessSlug = this.getAttribute('business-slug') || '';
        
        try {
            // Show loading state
            this.shadowRoot.innerHTML = '<div class="loading">Loading booking widget...</div>';
            
            // Load all dependencies
            await this.loadDependencies();
            
            // Load template and styles
            await Promise.all([
                this.loadTemplate(),
                this.loadStyles()
            ]);
            
            // Initialize the widget
            await this.initializeWidget();
            
        } catch (error) {
            console.error('Failed to initialize booking widget:', error);
            this.renderError('Failed to load booking widget. Please refresh the page.');
        }
    }

    async loadDependencies() {
        const dependencies = [
            'js/booking-utils.js',
            'js/booking-api.js',
            'js/booking-scheduler.js',
            'js/booking-form.js'
        ];

        // Load all dependencies in parallel
        await Promise.all(dependencies.map(dep => this.loadScript(dep)));
        
        this.dependenciesLoaded = true;
        console.log('All booking widget dependencies loaded successfully');
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if the script is already loaded
            if (this.isScriptLoaded(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    isScriptLoaded(src) {
        return document.querySelector(`script[src="${src}"]`) !== null;
    }

    async loadTemplate() {
        try {
            const response = await fetch('./template.html');
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.statusText}`);
            }
            this.template = await response.text();
        } catch (error) {
            console.error('Failed to load template:', error);
            throw new Error('Template file is required but could not be loaded');
        }
    }

    async loadStyles() {
        try {
            const response = await fetch('./styles.css');
            if (!response.ok) {
                throw new Error(`Failed to load styles: ${response.statusText}`);
            }
            this.styles = await response.text();
        } catch (error) {
            console.error('Failed to load styles:', error);
            throw new Error('Styles file is required but could not be loaded');
        }
    }

    async initializeWidget() {
        if (!this.dependenciesLoaded || !this.apiUrl || !this.businessSlug) {
            return;
        }

        // Check if required classes are available
        if (typeof BookingAPI === 'undefined' || 
            typeof BookingScheduler === 'undefined' || 
            typeof BookingForm === 'undefined' || 
            typeof BookingUtils === 'undefined') {
            throw new Error('Required booking widget classes are not available');
        }

        // Initialize API helper
        this.api = new BookingAPI(this.apiUrl, this.businessSlug);
        
        // Render the widget
        this.render();
        
        // Load business data first, then services
        await this.loadBusinessData();
        await this.loadServices();
    }

    async loadBusinessData() {
        if (!this.api) return;

        try {
            this.businessData = await this.api.loadBusinessData();
            // Initialize scheduler after business data is loaded
            this.scheduler = new BookingScheduler(this.businessData);
        } catch (error) {
            console.error('Failed to load business data:', error);
            this.renderError('Failed to load business information');
        }
    }

    async loadServices() {
        if (!this.api) return;

        try {
            this.services = await this.api.loadServices();
            
            if (this.services.length === 1) {
                this.selectedService = this.services[0].id;
                this.selectedServiceData = this.services[0];
                this.autoSkipToScheduling();
            } else {
                this.renderServices(this.services);
            }
        } catch (error) {
            console.error('Failed to load services:', error);
            this.renderError('Failed to load services');
        }
    }

    render() {
        if (!this.template || !this.styles) {
            this.shadowRoot.innerHTML = '<div class="loading">Loading widget components...</div>';
            return;
        }

        this.shadowRoot.innerHTML = `
            <style>${this.styles}</style>
            ${this.template}
        `;

        this.setupEventListeners();
        // Remove the loadServices() call from here since it's now called in initializeWidget()
    }

    // Add this method to handle step transitions
    nextStep() {
        const currentStep = this.shadowRoot.querySelector('.step.active');
        const nextStep = this.shadowRoot.getElementById('step-2');
        
        if (currentStep && nextStep) {
            currentStep.classList.remove('active');
            nextStep.classList.add('active');
            
            // Update the booking summary and render custom questions
            this.updateBookingSummary();
            this.renderCustomQuestions();
        }
    }

    // Update the renderCustomQuestions method to add debugging
    async renderCustomQuestions() {
        const container = this.shadowRoot.getElementById('custom-questions-container');
        if (!container || !this.selectedServiceData?.customQuestions) return;

        // Clear existing questions
        container.innerHTML = '';

        try {
            // Load all custom questions using the existing API method
            const allCustomQuestions = await this.api.loadCustomQuestions();
            
            // Add debugging to see the structure
            console.log('All custom questions:', allCustomQuestions);
            console.log('Service custom questions:', this.selectedServiceData.customQuestions);
            
            // Filter to only show questions that are referenced by this service
            const serviceQuestionIds = this.selectedServiceData.customQuestions.map(q => q.questionId);
            const relevantQuestions = allCustomQuestions.filter(q => serviceQuestionIds.includes(q.id));
            
            console.log('Relevant questions:', relevantQuestions);
            
            // Render each relevant question
            relevantQuestions.forEach(questionData => {
                const questionRef = this.selectedServiceData.customQuestions.find(q => q.questionId === questionData.id);
                this.renderCustomQuestion(container, questionData, questionRef);
            });
        } catch (error) {
            console.error('Failed to load custom questions:', error);
        }
    }

    // Update the renderCustomQuestion method to handle different property names
    renderCustomQuestion(container, questionData, questionRef) {
        const questionElement = document.createElement('div');
        questionElement.className = 'custom-question-group';
        
        const isRequired = questionRef?.isRequired || false;
        const requiredText = isRequired ? ' *' : '';
        
        // Debug the question data structure
        console.log('Rendering question:', questionData);
        
        // Try different possible property names for the question text
        const questionText = questionData.text || 
                           questionData.displayName || 
                           questionData.title || 
                           questionData.question || 
                           questionData.label || 
                           'Untitled Question';
        
        const questionType = questionData.type || 'text';
        const questionId = questionData.id || questionData.questionId;
        
        // Handle different question types
        switch (questionType.toLowerCase()) {
            case 'text':
            case 'string':
                questionElement.innerHTML = `
                    <div class="form-group">
                        <label for="custom-${questionId}">${questionText}${requiredText}</label>
                        <input 
                            type="text" 
                            id="custom-${questionId}" 
                            name="custom-${questionId}"
                            ${isRequired ? 'required' : ''}
                            placeholder="${questionData.placeholder || ''}"
                        >
                    </div>
                `;
                break;
                
            case 'textarea':
            case 'longtext':
                questionElement.innerHTML = `
                    <div class="form-group">
                        <label for="custom-${questionId}">${questionText}${requiredText}</label>
                        <textarea 
                            id="custom-${questionId}" 
                            name="custom-${questionId}"
                            rows="3"
                            ${isRequired ? 'required' : ''}
                            placeholder="${questionData.placeholder || ''}"
                        ></textarea>
                    </div>
                `;
                break;
                
            case 'radio':
            case 'singlechoice':
                const radioOptions = questionData.options?.map(option => `
                    <div class="radio-option">
                        <input 
                            type="radio" 
                            id="custom-${questionId}-${option.id || option.value}" 
                            name="custom-${questionId}"
                            value="${option.value || option.text}"
                            ${isRequired ? 'required' : ''}
                        >
                        <label class="radio-label" for="custom-${questionId}-${option.id || option.value}">
                            ${option.text || option.label || option.value}
                        </label>
                    </div>
                `).join('') || '';
                
                questionElement.innerHTML = `
                    <div class="form-group">
                        <label>${questionText}${requiredText}</label>
                        <div class="radio-group">
                            ${radioOptions}
                        </div>
                    </div>
                `;
                break;
                
            case 'select':
            case 'dropdown':
                const selectOptions = questionData.options?.map(option => `
                    <option value="${option.value || option.text}">${option.text || option.label || option.value}</option>
                `).join('') || '';
                
                questionElement.innerHTML = `
                    <div class="form-group">
                        <label for="custom-${questionId}">${questionText}${requiredText}</label>
                        <select 
                            id="custom-${questionId}" 
                            name="custom-${questionId}"
                            ${isRequired ? 'required' : ''}
                        >
                            <option value="">Please select...</option>
                            ${selectOptions}
                        </select>
                    </div>
                `;
                break;
                
            default:
                // Default to text input
                questionElement.innerHTML = `
                    <div class="form-group">
                        <label for="custom-${questionId}">${questionText}${requiredText}</label>
                        <input 
                            type="text" 
                            id="custom-${questionId}" 
                            name="custom-${questionId}"
                            ${isRequired ? 'required' : ''}
                        >
                    </div>
                `;
        }
        
        container.appendChild(questionElement);
    }

    previousStep() {
        const currentStep = this.shadowRoot.querySelector('.step.active');
        const prevStep = this.shadowRoot.getElementById('step-1');
        
        if (currentStep && prevStep) {
            currentStep.classList.remove('active');
            prevStep.classList.add('active');
        }
    }

    updateBookingSummary() {
        const summaryService = this.shadowRoot.getElementById('summary-service');
        const summaryDatetime = this.shadowRoot.getElementById('summary-datetime');
        const summaryDuration = this.shadowRoot.getElementById('summary-duration');
        
        if (summaryService && this.selectedServiceData) {
            summaryService.textContent = this.selectedServiceData.displayName;
        }
        
        if (summaryDatetime && this.selectedDateTime) {
            summaryDatetime.textContent = BookingUtils.formatSelectedDateTime(this.selectedDateTime);
        }
        
        if (summaryDuration && this.selectedServiceData) {
            summaryDuration.textContent = BookingUtils.formatDuration(this.selectedServiceData.defaultDuration);
        }
    }

    setupEventListeners() {
        const backBtn = this.shadowRoot.querySelector('.btn-back');
        if (backBtn) {
            backBtn.removeEventListener('click', this.previousStep);
            backBtn.addEventListener('click', () => this.previousStep());
        }

        const customerForm = this.shadowRoot.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitBooking();
            });
        }
    }

    autoSkipToScheduling() {
        this.renderServices(this.services);
        // Add null check for scheduler
        if (this.scheduler) {
            this.initializeDateTimeSelection();
        } else {
            console.warn('Scheduler not initialized yet, retrying...');
            // Retry after a short delay
            setTimeout(() => {
                if (this.scheduler) {
                    this.initializeDateTimeSelection();
                } else {
                    console.error('Scheduler still not available after retry');
                }
            }, 100);
        }
    }

    initializeDateTimeSelection() {
        // Add null check for scheduler
        if (!this.scheduler) {
            console.error('Scheduler not initialized');
            return;
        }

        const dateTimeSection = this.shadowRoot.getElementById('date-time-section');
        if (dateTimeSection) {
            dateTimeSection.style.display = 'block';
        }

        this.scheduler.currentStartDate = new Date();
        this.scheduler.currentStartDate.setHours(0, 0, 0, 0);
        
        this.updateDateRangeDisplay();
        this.setupDateNavigation();
        this.loadAvailability();
    }

    setupDateNavigation() {
        const prevWeekBtn = this.shadowRoot.getElementById('prev-week');
        const nextWeekBtn = this.shadowRoot.getElementById('next-week');
        
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                if (!this.scheduler) return;
                
                this.scheduler.navigateDays(-7);
                this.updateDateRangeDisplay();
                this.loadAvailability();
                
                const timeSection = this.shadowRoot.getElementById('time-section');
                if (timeSection) {
                    timeSection.style.display = 'none';
                }
            });
        }
        
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                if (!this.scheduler) return;
                
                this.scheduler.navigateDays(7);
                this.updateDateRangeDisplay();
                this.loadAvailability();
                
                const timeSection = this.shadowRoot.getElementById('time-section');
                if (timeSection) {
                    timeSection.style.display = 'none';
                }
            });
        }
    }

    updateDateRangeDisplay() {
        if (!this.scheduler) return;
        
        const currentWeekSpan = this.shadowRoot.querySelector('.current-week');
        if (currentWeekSpan) {
            currentWeekSpan.textContent = this.scheduler.getDateRangeDisplay();
        }
    }

    async loadAvailability() {
        if (!this.selectedServiceData || !this.businessData || !this.scheduler) return;

        try {
            // Get staff IDs from the selected service data instead of business data
            const staffIds = this.selectedServiceData.staffMemberIds || [];
            
            // If no staff IDs available, log error and return
            if (staffIds.length === 0) {
                console.warn('No staff IDs available for availability check - service may not have assigned staff members');
                return;
            }

            const startDate = new Date(this.scheduler.currentStartDate);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);

            // Use a Microsoft Graph compatible timezone format
            // Microsoft Graph expects timezone IDs like "Eastern Standard Time" instead of "America/New_York"
            const businessTimezone = BookingUtils.getBusinessTimezone(this.businessData);
            const graphTimezone = this.convertToGraphTimezone(businessTimezone);

            const startDateTime = {
                dateTime: startDate.toISOString().slice(0, 19), // Remove 'Z' suffix
                timeZone: graphTimezone
            };
            
            const endDateTime = {
                dateTime: endDate.toISOString().slice(0, 19), // Remove 'Z' suffix
                timeZone: graphTimezone
            };

            this.scheduler.availabilityData = await this.api.loadStaffAvailability(staffIds, startDateTime, endDateTime);
            this.renderDateGrid();
        } catch (error) {
            console.error('Failed to load availability:', error);
        }
    }

    // Add this helper method to convert IANA timezone to Microsoft Graph timezone
    convertToGraphTimezone(ianaTimezone) {
        // Common IANA to Microsoft Graph timezone mappings
        const timezoneMap = {
            'America/New_York': 'Eastern Standard Time',
            'America/Chicago': 'Central Standard Time',
            'America/Denver': 'Mountain Standard Time',
            'America/Los_Angeles': 'Pacific Standard Time',
            'America/Phoenix': 'US Mountain Standard Time',
            'America/Anchorage': 'Alaskan Standard Time',
            'Pacific/Honolulu': 'Hawaiian Standard Time',
            'Europe/London': 'GMT Standard Time',
            'Europe/Paris': 'Romance Standard Time',
            'Europe/Berlin': 'W. Europe Standard Time',
            'Asia/Tokyo': 'Tokyo Standard Time',
            'Australia/Sydney': 'AUS Eastern Standard Time',
            'UTC': 'UTC'
        };

        // Return the mapped timezone or default to UTC if not found
        return timezoneMap[ianaTimezone] || 'UTC';
    }

    renderDateGrid() {
        if (!this.scheduler) return;
        
        const dateGrid = this.shadowRoot.getElementById('date-grid');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const days = this.scheduler.generateDays();
        const dailyAvailability = this.scheduler.processDailyAvailability(days, this.selectedServiceData);

        dateGrid.innerHTML = days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const availability = dailyAvailability[dateStr] || [];
            const isToday = BookingUtils.isSameDay(date, today);
            const isPast = date < today;
            const hasAvailability = availability.length > 0 && !isPast;
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();

            const isDisabled = isPast || !hasAvailability;
            const buttonClass = `date-item ${isPast ? 'past' : ''} ${hasAvailability ? 'available' : 'unavailable'} ${isToday ? 'today' : ''}`;

            return `
                <button class="${buttonClass}" 
                        data-date="${dateStr}" 
                        ${isDisabled ? 'disabled' : ''}
                        ${!isDisabled ? 'data-clickable="true"' : ''}>
                    <div class="date-day">${dayName}</div>
                    <div class="date-number">${dayNumber}</div>
                    ${isToday ? '<div class="today-indicator">Today</div>' : ''}
                </button>
            `;
        }).join('');

        dateGrid.querySelectorAll('.date-item[data-clickable="true"]').forEach(item => {
            item.addEventListener('click', () => {
                dateGrid.querySelectorAll('.date-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                const selectedDate = item.dataset.date;
                this.loadTimeSlots(selectedDate, dailyAvailability[selectedDate]);
            });
        });
    }

    renderServices(services) {
        const servicesList = this.shadowRoot.getElementById('services-list');
        
        if (!servicesList) return;
        
        if (!services || services.length === 0) {
            servicesList.innerHTML = '<p class="no-services">No services available at this time.</p>';
            return;
        }

        if (services.length === 1) {
            const service = services[0];
            servicesList.innerHTML = `
                <div class="service-item selected" data-service-id="${service.id}">
                    <div class="service-icon">
                        ${BookingUtils.getServiceIcon(service.displayName)}
                    </div>
                    <div class="service-info">
                        <div class="service-name">${service.displayName}</div>
                        <div class="service-duration">${BookingUtils.formatDuration(service.defaultDuration)}</div>
                        ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
                    </div>
                    <div class="service-price">
                        ${BookingUtils.formatPrice(service.defaultPrice, service.defaultPriceType)}
                    </div>
                </div>
                <div class="auto-skip-message">
                    <small>✓ Service automatically selected. Choose your preferred time below.</small>
                </div>
            `;
        } else {
            servicesList.innerHTML = services.map(service => `
                <div class="service-item" data-service-id="${service.id}">
                    <div class="service-icon">
                        ${BookingUtils.getServiceIcon(service.displayName)}
                    </div>
                    <div class="service-info">
                        <div class="service-name">${service.displayName}</div>
                        <div class="service-duration">${BookingUtils.formatDuration(service.defaultDuration)}</div>
                        ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
                    </div>
                    <div class="service-price">
                        ${BookingUtils.formatPrice(service.defaultPrice, service.defaultPriceType)}
                    </div>
                </div>
            `).join('');

            servicesList.querySelectorAll('.service-item').forEach(item => {
                item.addEventListener('click', () => {
                    servicesList.querySelectorAll('.service-item').forEach(i => 
                        i.classList.remove('selected')
                    );
                    item.classList.add('selected');
                    this.selectedService = item.dataset.serviceId;
                    this.selectedServiceData = services.find(s => s.id === item.dataset.serviceId);
                    
                    // Add null check before calling initializeDateTimeSelection
                    if (this.scheduler) {
                        this.initializeDateTimeSelection();
                    } else {
                        console.warn('Scheduler not available when service selected');
                    }
                });
            });
        }
    }

    async submitBooking() {
        try {
            // Show loading state
            const submitBtn = this.shadowRoot.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating booking...';
            }

            // Collect form data
            const form = this.shadowRoot.getElementById('customer-form');
            const formData = new FormData(form);
            
            // Get form values
            const name = formData.get('name');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const notes = formData.get('notes') || '';
            
            // Collect custom question answers
            const customAnswers = this.collectCustomAnswers();
            
            // Build the booking form info list
            const bookingFormInfoList = [
                { questionId: 'name', answerText: name },
                { questionId: 'email', answerText: email },
                { questionId: 'phone', answerText: phone }
            ];
            
            // Add custom question answers to the form info list
            Object.entries(customAnswers).forEach(([questionId, answer]) => {
                if (answer) {
                    bookingFormInfoList.push({
                        questionId: questionId,
                        answerText: answer.toString()
                    });
                }
            });
            
            // Calculate end time based on service duration
            const startTime = new Date(this.selectedDateTime.dateTime);
            const serviceDurationMs = BookingUtils.getServiceDurationMinutes(this.selectedServiceData.defaultDuration) * 60 * 1000;
            const endTime = new Date(startTime.getTime() + serviceDurationMs);
            
            const bookingData = {
                serviceId: this.selectedService,
                start: {
                    dateTime: startTime.toISOString().slice(0, 19),
                    timeZone: this.selectedDateTime.timeZone
                },
                end: {
                    dateTime: endTime.toISOString().slice(0, 19),
                    timeZone: this.selectedDateTime.timeZone
                },
                customerName: name,
                customerEmailAddress: email,
                customerPhone: phone,
                customerTimeZone: this.selectedDateTime.timeZone,
                duration: this.selectedServiceData.defaultDuration,
                isLocationOnline: false,
                smsNotificationsEnabled: true,
                price: this.selectedServiceData.defaultPrice || 0,
                priceType: this.selectedServiceData.defaultPriceType || 'free',
                customerNotes: notes,
                staffMemberIds: [this.selectedDateTime.staffId],
            };

            console.log('Sending booking data:', bookingData);
            
            const result = await this.api.createAppointment(bookingData);
            this.showSuccessMessage('Your booking has been confirmed!', result);
            
        } catch (error) {
            console.error('Booking failed:', error);
            this.showError('Failed to create booking. Please try again.');
            
            // Re-enable submit button
            const submitBtn = this.shadowRoot.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirm Booking';
            }
        }
    }

    showError(message) {
        const currentStep = this.shadowRoot.querySelector('.step.active');
        if (currentStep) {
            // Find existing error message and remove it
            const existingError = currentStep.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            // Create new error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <div class="error-icon">⚠️</div>
                <div class="error-text">${message}</div>
            `;

            // Insert at the top of the current step
            currentStep.insertBefore(errorDiv, currentStep.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        }
    }

    // Add method to collect custom question answers
    collectCustomAnswers() {
        const answers = {};
        const customQuestionInputs = this.shadowRoot.querySelectorAll('[name^="custom-"]');
        
        customQuestionInputs.forEach(input => {
            const questionId = input.name.replace('custom-', '');
            if (input.type === 'radio') {
                if (input.checked) {
                    answers[questionId] = input.value;
                }
            } else {
                answers[questionId] = input.value;
            }
        });
        
        return answers;
    }

    showSuccessMessage(message, bookingData = null) {
        const currentStep = this.shadowRoot.querySelector('.step.active');
        
        let bookingDetails = '';
        if (bookingData) {
            bookingDetails = `
                <div class="success-details">
                    <p><strong>Booking ID:</strong> ${bookingData.id || 'N/A'}</p>
                    <p><strong>Service:</strong> ${this.selectedServiceData.displayName}</p>
                    <p><strong>Date & Time:</strong> ${BookingUtils.formatSelectedDateTime(this.selectedDateTime)}</p>
                    <p><strong>Duration:</strong> ${BookingUtils.formatDuration(this.selectedServiceData.defaultDuration)}</p>
                    ${bookingData.confirmationNumber ? `<p><strong>Confirmation:</strong> ${bookingData.confirmationNumber}</p>` : ''}
                </div>
            `;
        } else {
            bookingDetails = `
                <div class="success-details">
                    <p><strong>Service:</strong> ${this.selectedServiceData.displayName}</p>
                    <p><strong>Date & Time:</strong> ${BookingUtils.formatSelectedDateTime(this.selectedDateTime)}</p>
                </div>
            `;
        }
        
        currentStep.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✅</div>
                <h3>Booking Confirmed!</h3>
                <p>${message}</p>
                ${bookingDetails}
                <button class="btn btn-primary" onclick="window.location.reload()">
                    Book Another Appointment
                </button>
            </div>
        `;
    }

    renderError(message) {
        const servicesList = this.shadowRoot.getElementById('services-list');
        if (servicesList) {
            servicesList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                    <button class="btn btn-secondary" onclick="window.location.reload()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    async loadTimeSlots(selectedDate) {
        if (!this.selectedServiceData || !this.scheduler) return;

        try {
            const timeSection = this.shadowRoot.getElementById('time-section');
            if (!timeSection) return;

            // Show loading state
            timeSection.innerHTML = '<div class="loading">Loading available times...</div>';
            timeSection.style.display = 'block';

            // Get available time slots for the selected date
            const timeSlots = this.scheduler.getAvailableTimeSlots(selectedDate, this.selectedServiceData);

            if (timeSlots.length === 0) {
                timeSection.innerHTML = '<div class="no-times">No available times for this date</div>';
                return;
            }

            // Render time slots
            timeSection.innerHTML = `
                <h3>Available Times</h3>
                <div class="time-slots">
                    ${timeSlots.map(slot => `
                        <button class="time-slot" data-time="${slot.dateTime}" data-staff-id="${slot.staffId}">
                            ${BookingUtils.formatTimeSlot(new Date(slot.dateTime))}
                        </button>
                    `).join('')}
                </div>
            `;

            // Add event listeners to time slots
            const timeSlotButtons = timeSection.querySelectorAll('.time-slot');
            timeSlotButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove selected class from all time slots
                    timeSlotButtons.forEach(btn => btn.classList.remove('selected'));
                    
                    // Add selected class to clicked button
                    button.classList.add('selected');
                    
                    // Store selected time with staff ID
                    this.selectedDateTime = {
                        dateTime: button.dataset.time,
                        timeZone: BookingUtils.getBusinessTimezone(this.businessData),
                        staffId: button.dataset.staffId
                    };

                    // Automatically progress to next step
                    setTimeout(() => {
                        this.nextStep();
                    }, 300); // Small delay for visual feedback
                });
            });

        } catch (error) {
            console.error('Failed to load time slots:', error);
            const timeSection = this.shadowRoot.getElementById('time-section');
            if (timeSection) {
                timeSection.innerHTML = '<div class="error">Failed to load available times</div>';
            }
        }
    }
}

// Register the custom element
customElements.define('booking-widget', BookingWidget);