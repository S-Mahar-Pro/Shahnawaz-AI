const express = require('express');
const router = express.Router();
const { isAuthenticated, checkPlan } = require('../middleware/auth');
const { generateContent } = require('../utils/gemini');

// Translation
router.post('/translate', isAuthenticated, async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res.status(400).json({ error: 'Text and target language are required' });
        }
        const prompt = `Translate the following text to ${targetLanguage}. Only return the translation, no explanations:\n\n${text}`;
        const translation = await generateContent(prompt);
        if (!translation) {
            return res.status(500).json({ error: 'Translation failed. Please try again.' });
        }
        res.json({ success: true, translation });
    } catch (error) {
        console.error('Translation error:', error.message);
        res.status(500).json({ error: 'Translation service error. Please try again.' });
    }
});

// Content Generation
router.post('/content', isAuthenticated, checkPlan(['gold', 'diamond']), async (req, res) => {
    try {
        const { type, topic, tone, length } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }
        const prompt = `Create a ${length || 'medium'} ${type || 'blog post'} about "${topic}" in a ${tone || 'professional'} tone. Make it engaging and professional.`;
        const content = await generateContent(prompt);
        if (!content) {
            return res.status(500).json({ error: 'Content generation failed' });
        }
        res.json({ success: true, content });
    } catch (error) {
        console.error('Content generation error:', error.message);
        res.status(500).json({ error: 'Failed to generate content. Please try again.' });
    }
});

// YouTube Tools
router.post('/youtube', isAuthenticated, checkPlan(['diamond']), async (req, res) => {
    try {
        const { videoTopic, type } = req.body;
        if (!videoTopic) {
            return res.status(400).json({ error: 'Video topic is required' });
        }
        
        let prompt = '';
        if (type === 'captions') {
            prompt = `Generate accurate, timestamped SRT format captions for a video about: ${videoTopic}`;
        } else if (type === 'title') {
            prompt = `Generate 5 catchy, SEO-optimized YouTube titles for a video about: ${videoTopic}`;
        } else if (type === 'description') {
            prompt = `Write an SEO-optimized YouTube description with hashtags for a video about: ${videoTopic}`;
        } else if (type === 'summary') {
            prompt = `Create a detailed video summary and chapter timestamps for: ${videoTopic}`;
        } else {
            prompt = `Create YouTube content for a video about: ${videoTopic}`;
        }
        
        const result = await generateContent(prompt);
        if (!result) {
            return res.status(500).json({ error: 'YouTube tool failed' });
        }
        res.json({ success: true, result });
    } catch (error) {
        console.error('YouTube tool error:', error.message);
        res.status(500).json({ error: 'YouTube tool error. Please try again.' });
    }
});

// Shopify SEO
router.post('/shopify', isAuthenticated, checkPlan(['diamond']), async (req, res) => {
    try {
        const { productName, category, keywords } = req.body;
        if (!productName) {
            return res.status(400).json({ error: 'Product name is required' });
        }
        
        const prompt = `Create Shopify SEO content for product "${productName}" in category "${category || 'General'}". 
Target keywords: ${keywords || productName}.
Provide:
1. SEO-optimized title (70 chars max)
2. Meta description (160 chars max)
3. Product description (professional, persuasive)
4. Alt text for images
5. URL slug suggestion`;
        
        const result = await generateContent(prompt);
        if (!result) {
            return res.status(500).json({ error: 'Shopify SEO tool failed' });
        }
        res.json({ success: true, result });
    } catch (error) {
        console.error('Shopify SEO error:', error.message);
        res.status(500).json({ error: 'Shopify SEO tool error. Please try again.' });
    }
});

// Business Assistant
router.post('/business', isAuthenticated, checkPlan(['gold', 'diamond']), async (req, res) => {
    try {
        const { query, type } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Business query is required' });
        }
        
        const prompt = `As a business expert, provide professional advice for: ${query}. 
Type: ${type || 'general'}. 
Format: Clear, actionable points with examples where relevant.`;
        
        const result = await generateContent(prompt);
        if (!result) {
            return res.status(500).json({ error: 'Business tool failed' });
        }
        res.json({ success: true, result });
    } catch (error) {
        console.error('Business tool error:', error.message);
        res.status(500).json({ error: 'Business assistant error. Please try again.' });
    }
});

module.exports = router;