// Main JavaScript for S FUTURE AI
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
        
        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });
        
        // Auto-dismiss alerts
        document.querySelectorAll('.alert').forEach(alert => {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        });
    } catch (error) {
        console.error('Main JS error:', error.message);
    }
});

// Utility functions
const showToast = (message, type = 'success') => {
    try {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 12px 20px;
            border-radius: 8px; color: white; font-weight: 500; z-index: 10000;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    } catch (error) {
        console.error('Toast error:', error.message);
        alert(message);
    }
};