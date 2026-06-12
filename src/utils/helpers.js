const formatBytes = (bytes, decimals = 2) => {
    try {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    } catch (error) {
        console.error('Format bytes error:', error.message);
        return '0 Bytes';
    }
};

const getPlanColor = (plan) => {
    try {
        const colors = {
            free: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db', name: 'Free' },
            gold: { bg: '#fffbeb', text: '#d97706', border: '#fbbf24', name: 'Gold' },
            diamond: { bg: '#fef2f2', text: '#dc2626', border: '#f87171', name: 'Diamond' }
        };
        return colors[plan] || colors.free;
    } catch (error) {
        console.error('Plan color error:', error.message);
        return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db', name: 'Free' };
    }
};

const getPlanFeatures = (plan) => {
    try {
        const features = {
            free: ['Unlimited text chat', 'Basic AI responses', 'Multi-language support'],
            gold: ['Unlimited text chat', 'PDF analysis', 'Excel analysis', 'File uploads', 'Translation', 'Voice input/output', 'Business assistance', 'Content generation', 'SEO tools'],
            diamond: ['Everything in Gold', 'Multiple AI assistants', 'Real-time conversational AI', 'YouTube caption generation', 'Subtitle translation', 'Shopify SEO tools', 'Premium AI workflows', 'Private encrypted vault', 'Secure file storage', 'Priority AI processing', 'Advanced productivity tools']
        };
        return features[plan] || features.free;
    } catch (error) {
        console.error('Plan features error:', error.message);
        return ['Basic features'];
    }
};

module.exports = { formatBytes, getPlanColor, getPlanFeatures };