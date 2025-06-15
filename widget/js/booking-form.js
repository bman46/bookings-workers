// Form handling and validation
class BookingForm {
    constructor(shadowRoot, customQuestions) {
        this.shadowRoot = shadowRoot;
        this.customQuestions = customQuestions || [];
    }

    renderCustomQuestions() {
        const form = this.shadowRoot.getElementById('customer-form');
        if (!form || !this.customQuestions.length) return;

        // Remove existing custom questions
        form.querySelectorAll('.custom-question-group').forEach(group => group.remove());
        
        const customQuestionsHTML = this.customQuestions.map(question => {
            const fieldId = `custom-question-${question.id}`;
            const isRequired = question.isRequired;
            
            let inputHTML = '';
            
            switch (question.answerInputType) {
                case 'text':
                    inputHTML = `
                        <input type="text" 
                               id="${fieldId}" 
                               name="customQuestion_${question.id}" 
                               ${isRequired ? 'required' : ''}>
                    `;
                    break;
                    
                case 'radioButton':
                    if (question.answerOptions && question.answerOptions.length > 0) {
                        inputHTML = `
                            <div class="radio-group">
                                ${question.answerOptions.map((option, index) => `
                                    <label class="radio-option">
                                        <input type="radio" 
                                               name="customQuestion_${question.id}" 
                                               value="${option}"
                                               id="${fieldId}_${index}"
                                               ${isRequired ? 'required' : ''}>
                                        <span class="radio-label">${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                        `;
                    } else {
                        inputHTML = `
                            <input type="text" 
                                   id="${fieldId}" 
                                   name="customQuestion_${question.id}" 
                                   ${isRequired ? 'required' : ''}>
                        `;
                    }
                    break;
                    
                default:
                    inputHTML = `
                        <input type="text" 
                               id="${fieldId}" 
                               name="customQuestion_${question.id}" 
                               ${isRequired ? 'required' : ''}>
                    `;
                    break;
            }
            
            return `
                <div class="form-group custom-question-group">
                    <label for="${fieldId}">
                        ${question.displayName}${isRequired ? ' *' : ''}
                    </label>
                    ${inputHTML}
                </div>
            `;
        }).join('');
        
        // Insert before booking summary
        const bookingSummary = form.querySelector('.booking-summary');
        if (bookingSummary) {
            bookingSummary.insertAdjacentHTML('beforebegin', customQuestionsHTML);
        } else {
            form.insertAdjacentHTML('beforeend', customQuestionsHTML);
        }
    }

    collectFormData() {
        const form = this.shadowRoot.getElementById('customer-form');
        const formData = new FormData(form);
        
        const answeredCustomQuestions = [];
        this.customQuestions.forEach(question => {
            const fieldName = `customQuestion_${question.id}`;
            const answer = formData.get(fieldName);
            
            answeredCustomQuestions.push({
                customQuestion: {
                    id: question.id,
                    questionText: question.displayName,
                    answerOptions: question.answerOptions || [],
                    answerInputType: question.answerInputType === 'text' ? 'ANSWER_INPUT_TYPE_TEXT' : 
                                   question.answerInputType === 'radioButton' ? 'ANSWER_INPUT_TYPE_RADIO_BUTTON' : 
                                   'ANSWER_INPUT_TYPE_TEXT'
                },
                answer: answer?.trim() || "",
                isRequired: question.isRequired || false,
                selectedOptions: []
            });
        });

        return {
            name: formData.get('name')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            phone: formData.get('phone')?.trim() || '',
            notes: formData.get('notes')?.trim() || '',
            answeredCustomQuestions
        };
    }

    showErrorMessage(message) {
        const form = this.shadowRoot.getElementById('customer-form');
        
        const existingError = form.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
        `;
        
        form.insertBefore(errorDiv, form.firstChild);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}