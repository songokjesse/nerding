// check-models.js
// This script lists all available Gemini models for your API key

async function listModels() {
    // Load API key from environment
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error("ERROR: GEMINI_API_KEY not found in environment");
        process.exit(1);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("=== AVAILABLE MODELS WITH generateContent SUPPORT ===\n");
        if (data.models) {
            const contentModels = data.models.filter(m =>
                m.supportedGenerationMethods &&
                m.supportedGenerationMethods.includes("generateContent")
            );

            if (contentModels.length === 0) {
                console.log("No models found with generateContent support");
            } else {
                contentModels.forEach(m => {
                    const modelName = m.name.replace('models/', '');
                    console.log(`✓ ${modelName}`);
                });
            }
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
