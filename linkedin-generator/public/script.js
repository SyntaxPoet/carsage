class PostGenerator {
    constructor() {
        this.form = document.getElementById('post-form');
        this.resultSection = document.getElementById('result');
        this.errorSection = document.getElementById('error');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('regenerate-btn').addEventListener('click', () => this.regeneratePost());
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            topic: formData.get('topic'),
            audience: formData.get('audience'),
            style: formData.get('style')
        };

        // Validation
        if (!data.topic || !data.audience) {
            this.showError('Please select both a topic and target audience.');
            return;
        }

        this.setLoading(true);
        this.hideError();
        this.hideResult();

        try {
            const response = await fetch('/api/generate-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.displayResult(result);
            } else {
                this.showError(result.error || 'Failed to generate post');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoading(false);
        }
    }

    displayResult(result) {
        // Display the generated post content
        document.getElementById('post-content').textContent = result.content;
        
        // Display metadata
        document.getElementById('optimal-time').textContent = result.metadata.optimal_time;
        document.getElementById('hashtags').textContent = result.metadata.hashtags.join(' ');
        
        // Show the result section
        this.resultSection.classList.remove('hidden');
        
        // Add success animation
        this.resultSection.classList.add('success-flash');
        setTimeout(() => {
            this.resultSection.classList.remove('success-flash');
        }, 300);
        
        // Scroll to result
        this.resultSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    async copyToClipboard() {
        const content = document.getElementById('post-content').textContent;
        const hashtags = document.getElementById('hashtags').textContent;
        const fullPost = `${content}\n\n${hashtags}`;

        try {
            await navigator.clipboard.writeText(fullPost);
            this.showCopySuccess();
        } catch (error) {
            // Fallback for older browsers
            this.fallbackCopyTextToClipboard(fullPost);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess();
            } else {
                this.showError('Failed to copy to clipboard');
            }
        } catch (err) {
            this.showError('Failed to copy to clipboard');
        }
        
        document.body.removeChild(textArea);
    }

    showCopySuccess() {
        const copyBtn = document.getElementById('copy-btn');
        const originalText = copyBtn.textContent;
        
        copyBtn.classList.add('copied');
        copyBtn.textContent = 'Copied!';
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.textContent = originalText;
        }, 2000);
    }

    regeneratePost() {
        // Create a fake event object for handleSubmit
        const fakeEvent = {
            preventDefault: () => {}
        };
        this.handleSubmit(fakeEvent);
    }

    setLoading(isLoading) {
        const button = this.form.querySelector('.generate-btn');
        const btnText = button.querySelector('.btn-text');
        const loading = button.querySelector('.loading');

        if (isLoading) {
            button.disabled = true;
            btnText.classList.add('hidden');
            loading.classList.remove('hidden');
        } else {
            button.disabled = false;
            btnText.classList.remove('hidden');
            loading.classList.add('hidden');
        }
    }

    showError(message) {
        this.errorSection.textContent = message;
        this.errorSection.classList.remove('hidden');
        
        // Scroll to error if needed
        this.errorSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest'
        });
    }

    hideError() {
        this.errorSection.classList.add('hidden');
    }

    hideResult() {
        this.resultSection.classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            backgroundColor: type === 'success' ? '#28a745' : '#007bff',
            color: 'white',
            borderRadius: '6px',
            zIndex: '1000',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PostGenerator();
    
    // Add some easter eggs for power users
    console.log('🚀 LinkedIn Post Generator loaded!');
    console.log('💡 Tip: Try different combinations of topics and audiences for variety');
});

// Service worker registration for potential PWA features
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // We'll add this later if needed for offline functionality
    });
}