const { GoogleGenerativeAI } = require('@google/generative-ai');

// Validate API key exists
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing in environment variables');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = (modelName = 'gemini-pro') => {
    try {
        return genAI.getGenerativeModel({ model: modelName });
    } catch (error) {
        console.error('Model initialization error:', error.message);
        throw new Error('Failed to initialize AI model');
    }
};

const chatWithGemini = async (message, history = []) => {
    try {
        const model = getModel();
        const chat = model.startChat({
            history: history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            })),
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7
            }
        });
        
        const result = await chat.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error('Gemini Chat Error:', error.message);
        return 'I apologize, but I encountered an error processing your request. Please try again later.';
    }
};

const generateContent = async (prompt) => {
    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Gemini Generation Error:', error.message);
        return null;
    }
};

module.exports = { chatWithGemini, generateContent, getModel };