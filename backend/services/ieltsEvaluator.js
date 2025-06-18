const EssayAnalyzer = require('./essayAnalyzer');

class IELTSEvaluator {
    constructor() {
        this.analyzer = new EssayAnalyzer();
        
        // Criterios oficiales IELTS con pesos
        this.criteria = {
            taskAchievement: 0.25,
            coherenceCohesion: 0.25,
            lexicalResource: 0.25,
            grammaticalAccuracy: 0.25
        };
    }

    evaluateEssay(essayText, topic = null) {
        try {
            // Análisis básico del ensayo
            const analysis = this.analyzer.analyzeEssay(essayText, topic);
            
            // Evaluación por criterios IELTS
            const scores = {
                taskAchievement: this.evaluateTaskAchievement(analysis, topic),
                coherenceCohesion: this.evaluateCoherenceCohesion(analysis),
                lexicalResource: this.evaluateLexicalResource(analysis),
                grammaticalAccuracy: this.evaluateGrammaticalAccuracy(analysis)
            };
            
            // Calcular puntuación final
            const finalScore = this.calculateFinalScore(scores);
            
            // Generar feedback básico
            const feedback = this.generateBasicFeedback(scores, analysis);
            
            return {
                score: Math.round(finalScore * 10) / 10,
                wordCount: analysis.wordAnalysis.totalWords,
                detailedScores: {
                    taskAchievement: Math.round(scores.taskAchievement * 10) / 10,
                    coherenceCohesion: Math.round(scores.coherenceCohesion * 10) / 10,
                    lexicalResource: Math.round(scores.lexicalResource * 10) / 10,
                    grammaticalAccuracy: Math.round(scores.grammaticalAccuracy * 10) / 10
                },
                feedback,
                evaluatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error en evaluación IELTS:', error);
            return this.getBasicEvaluation(essayText);
        }
    }

    evaluateTaskAchievement(analysis, topic) {
        let score = 2.0;
        
        const wordCount = analysis.wordAnalysis.totalWords;
        const paragraphs = analysis.paragraphAnalysis.totalParagraphs;
        const structure = analysis.structureAnalysis;
        
        // Longitud del ensayo
        if (wordCount >= 250) score += 0.8;
        else if (wordCount >= 200) score += 0.5;
        else if (wordCount >= 150) score += 0.2;
        else score -= 0.5;
        
        // Estructura básica
        if (paragraphs >= 4) score += 0.5;
        else if (paragraphs >= 3) score += 0.3;
        
        // Introducción y conclusión
        if (structure.hasIntroduction) score += 0.4;
        if (structure.hasConclusion) score += 0.4;
        
        return Math.min(5.0, Math.max(1.0, score));
    }

    evaluateCoherenceCohesion(analysis) {
        let score = 2.0;
        
        const coherence = analysis.coherenceAnalysis;
        
        // Uso básico de conectores
        const totalConnectors = coherence.contrastConnectors + coherence.additionConnectors + 
                               coherence.causeEffectConnectors + coherence.exampleConnectors;
        
        if (totalConnectors >= 4) score += 0.6;
        else if (totalConnectors >= 2) score += 0.3;
        else if (totalConnectors >= 1) score += 0.1;
        
        // Estructura de párrafos
        const paragraphBalance = analysis.paragraphAnalysis.structureBalance;
        if (paragraphBalance === 'Well balanced') score += 0.4;
        else if (paragraphBalance === 'Moderately balanced') score += 0.2;
        
        return Math.min(5.0, Math.max(1.0, score));
    }

    evaluateLexicalResource(analysis) {
        let score = 2.0;
        
        const vocabulary = analysis.vocabularyAnalysis;
        const words = analysis.wordAnalysis;
        
        // Diversidad léxica básica
        const lexicalDiversity = words.lexicalDiversity;
        if (lexicalDiversity >= 0.5) score += 0.6;
        else if (lexicalDiversity >= 0.4) score += 0.4;
        else if (lexicalDiversity >= 0.3) score += 0.2;
        
        // Vocabulario formal
        if (vocabulary.formalVocabulary >= 3) score += 0.4;
        else if (vocabulary.formalVocabulary >= 1) score += 0.2;
        
        return Math.min(5.0, Math.max(1.0, score));
    }

    evaluateGrammaticalAccuracy(analysis) {
        let score = 2.0;
        
        const grammar = analysis.grammarAnalysis;
        const sentences = analysis.sentenceAnalysis;
        
        // Variedad de estructuras básica
        const avgSentenceLength = sentences.avgSentenceLength;
        if (avgSentenceLength >= 15) score += 0.3;
        else if (avgSentenceLength >= 12) score += 0.1;
        
        // Estructuras complejas básicas
        if (grammar.conditionalStructures >= 1) score += 0.2;
        if (grammar.relativeClauses >= 1) score += 0.1;
        if (grammar.passiveVoice >= 1) score += 0.1;
        
        return Math.min(5.0, Math.max(1.0, score));
    }

    calculateFinalScore(scores) {
        return (scores.taskAchievement * this.criteria.taskAchievement +
                scores.coherenceCohesion * this.criteria.coherenceCohesion +
                scores.lexicalResource * this.criteria.lexicalResource +
                scores.grammaticalAccuracy * this.criteria.grammaticalAccuracy);
    }

    generateBasicFeedback(scores, analysis) {
        const feedback = {
            general: this.getGeneralFeedback(scores),
            strengths: this.identifyBasicStrengths(scores, analysis),
            improvements: this.identifyBasicImprovements(scores, analysis)
        };
        
        return feedback;
    }

    getGeneralFeedback(scores) {
        const avgScore = (scores.taskAchievement + scores.coherenceCohesion + 
                         scores.lexicalResource + scores.grammaticalAccuracy) / 4;
        
        if (avgScore >= 4.0) {
            return "Excelente ensayo con estructura sólida y vocabulario apropiado.";
        } else if (avgScore >= 3.0) {
            return "Buen ensayo que cumple con los requisitos básicos.";
        } else if (avgScore >= 2.0) {
            return "El ensayo necesita mejoras en estructura y desarrollo.";
        } else {
            return "El ensayo requiere trabajo significativo en todos los aspectos.";
        }
    }

    identifyBasicStrengths(scores, analysis) {
        const strengths = [];
        
        if (scores.taskAchievement >= 3.5) {
            strengths.push("Buena estructura general del ensayo");
        }
        if (scores.coherenceCohesion >= 3.5) {
            strengths.push("Uso adecuado de conectores");
        }
        if (scores.lexicalResource >= 3.5) {
            strengths.push("Vocabulario variado");
        }
        if (scores.grammaticalAccuracy >= 3.5) {
            strengths.push("Estructuras gramaticales apropiadas");
        }
        
        if (analysis.wordAnalysis.totalWords >= 250) {
            strengths.push("Longitud apropiada del ensayo");
        }
        
        return strengths.length > 0 ? strengths : ["El ensayo muestra esfuerzo en su desarrollo"];
    }

    identifyBasicImprovements(scores, analysis) {
        const improvements = [];
        
        if (scores.taskAchievement < 3.0) {
            improvements.push("Desarrollar mejor la estructura del ensayo");
        }
        if (scores.coherenceCohesion < 3.0) {
            improvements.push("Usar más conectores para unir ideas");
        }
        if (scores.lexicalResource < 3.0) {
            improvements.push("Ampliar el vocabulario usado");
        }
        if (scores.grammaticalAccuracy < 3.0) {
            improvements.push("Revisar estructuras gramaticales");
        }
        
        if (analysis.wordAnalysis.totalWords < 250) {
            improvements.push("Aumentar la longitud del ensayo");
        }
        
        return improvements.length > 0 ? improvements : ["Continuar practicando la escritura académica"];
    }

    getBasicEvaluation(essayText) {
        const wordCount = essayText.split(/\s+/).length;
        
        return {
            score: 2.0,
            wordCount,
            detailedScores: {
                taskAchievement: 2.0,
                coherenceCohesion: 2.0,
                lexicalResource: 2.0,
                grammaticalAccuracy: 2.0
            },
            feedback: {
                general: "Error en el análisis. Puntuación básica asignada.",
                strengths: ["Ensayo enviado para evaluación"],
                improvements: ["Revisar contenido y estructura"]
            },
            evaluatedAt: new Date().toISOString()
        };
    }
}

module.exports = IELTSEvaluator;