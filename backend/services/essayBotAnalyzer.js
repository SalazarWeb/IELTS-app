const { GoogleGenerativeAI } = require('@google/generative-ai');

class EssayBotAnalyzer {
    constructor() {
        this.initializeAI();
        this.logger = console;
    }

    initializeAI() {
        // Inicializar Google Gemini AI (o puedes usar OpenAI)
        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        if (apiKey && process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        }
    }

    async analyzeEssay(essayText, prompt = null) {
        try {
            const analysisPrompt = prompt || `
                Analiza este ensayo IELTS Writing Task 2 y proporciona un análisis detallado:

                ENSAYO:
                ${essayText}

                Por favor proporciona:
                1. Puntuación estimada (1-9 en cada criterio)
                2. Análisis de Task Achievement/Response
                3. Coherencia y Cohesión
                4. Recursos Léxicos
                5. Gramática y Precisión
                6. Recomendaciones específicas para mejorar
                7. Ejemplos de mejoras

                Formato la respuesta de manera clara y estructurada.
            `;

            if (this.model) {
                const result = await this.model.generateContent(analysisPrompt);
                const response = await result.response;
                return {
                    success: true,
                    analysis: response.text(),
                    timestamp: new Date().toISOString(),
                    source: 'AI'
                };
            } else {
                // Análisis básico sin IA
                return this.basicAnalysis(essayText);
            }
        } catch (error) {
            this.logger.error('Error en análisis de ensayo:', error);
            return {
                success: false,
                error: 'Error al analizar el ensayo',
                fallback: this.basicAnalysis(essayText)
            };
        }
    }

    basicAnalysis(essayText) {
        const wordCount = essayText.split(' ').length;
        const paragraphs = essayText.split('\n').filter(p => p.trim().length > 0).length;
        
        return {
            success: true,
            analysis: {
                wordCount,
                paragraphs,
                basicFeedback: this.getBasicFeedback(wordCount, paragraphs),
                estimatedScore: this.estimateBasicScore(wordCount, paragraphs)
            },
            timestamp: new Date().toISOString(),
            source: 'basic'
        };
    }

    getBasicFeedback(wordCount, paragraphs) {
        let feedback = [];
        
        if (wordCount < 150) {
            feedback.push("⚠️ Tu ensayo tiene menos de 150 palabras. IELTS requiere mínimo 150 palabras.");
        } else if (wordCount < 280) {
            feedback.push("📝 Tu ensayo cumple el mínimo de palabras, pero podrías expandirlo un poco más.");
        } else {
            feedback.push("✅ Buena extensión del ensayo.");
        }

        if (paragraphs < 4) {
            feedback.push("📐 Considera usar al menos 4 párrafos: introducción, 2 párrafos de desarrollo y conclusión.");
        } else {
            feedback.push("✅ Buena estructura de párrafos.");
        }

        return feedback;
    }

    estimateBasicScore(wordCount, paragraphs) {
        let score = 5.0;
        
        if (wordCount >= 250) score += 0.5;
        if (wordCount >= 300) score += 0.5;
        if (paragraphs >= 4) score += 0.5;
        if (paragraphs >= 5) score += 0.5;
        
        return Math.min(score, 7.0);
    }

    async getTips(category = 'general') {
        const tips = {
            general: [
                "📚 Lee el prompt cuidadosamente y asegúrate de responder completamente",
                "🏗️ Usa una estructura clara: introducción, desarrollo, conclusión",
                "🔗 Conecta tus ideas con conectores apropiados",
                "📝 Practica escribir dentro del límite de tiempo (40 minutos)",
                "🔤 Revisa gramática y vocabulario antes de enviar"
            ],
            grammar: [
                "🔧 Usa una variedad de tiempos verbales apropiadamente",
                "🔗 Practica estructuras complejas pero correctas",
                "📖 Lee en inglés para mejorar tu sentido gramatical natural",
                "✏️ Revisa errores comunes como concordancia sujeto-verbo"
            ],
            vocabulary: [
                "📚 Aprende sinónimos para palabras comunes",
                "🎯 Usa vocabulario específico del tema",
                "🔄 Evita repetir las mismas palabras",
                "📝 Practica colocaciones y frases naturales"
            ],
            structure: [
                "🏗️ Párrafo 1: Introduce el tema y tu posición",
                "📊 Párrafos 2-3: Desarrolla argumentos con ejemplos",
                "🔚 Párrafo 4: Conclusión que resume tu posición",
                "🔗 Usa conectores para flujo lógico"
            ]
        };

        return {
            category,
            tips: tips[category] || tips.general,
            timestamp: new Date().toISOString()
        };
    }

    async getIELTSTopics() {
        return [
            "Technology has made our lives more complex vs easier - discuss",
            "Universities should offer practical vs theoretical subjects - opinion",
            "Learning foreign languages in primary vs secondary school - advantages/disadvantages",
            "Increasing elderly population - problems and solutions",
            "Online education vs traditional classroom learning - compare",
            "Environmental protection vs economic development - discuss",
            "Social media impact on relationships - positive/negative effects",
            "Work-life balance in modern society - causes and solutions"
        ];
    }

    async generateEssayPrompt(topic = null) {
        const topics = await this.getIELTSTopics();
        const selectedTopic = topic || topics[Math.floor(Math.random() * topics.length)];
        
        return {
            topic: selectedTopic,
            instructions: "Write at least 250 words. You should spend about 40 minutes on this task.",
            tips: "Remember to: 1) Answer all parts of the question, 2) Use clear paragraphs, 3) Give examples, 4) Check your grammar",
            timeLimit: 40,
            wordLimit: 250
        };
    }
}

module.exports = EssayBotAnalyzer;