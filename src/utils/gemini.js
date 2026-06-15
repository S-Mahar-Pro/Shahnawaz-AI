const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY missing');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ UPDATED MODEL (IMPORTANT FIX)
const getModel = () => {
    try {
        return genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });
    } catch (error) {
        console.error('Model init error:', error.message);
        throw error;
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
        console.error('❌ Gemini Chat Error FULL:', error);

        // 🔥 REAL ERROR (so you can debug)
        return `AI Error: ${error.message}`;
    }
};

const generateContent = async (prompt) => {
    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Generation Error:', error.message);
        return null;
    }
};

module.exports = { chatWithGemini, generateContent, getModel };
