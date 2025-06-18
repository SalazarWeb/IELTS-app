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

        // Palabras comunes en inglés para detectar idioma
        this.englishCommonWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'her', 'us', 'them',
            'some', 'any', 'all', 'each', 'every', 'many', 'much', 'more', 'most', 'few', 'less',
            'first', 'second', 'last', 'next', 'other', 'another', 'same', 'different',
            'people', 'person', 'time', 'way', 'day', 'man', 'thing', 'woman', 'life', 'child',
            'world', 'school', 'state', 'family', 'student', 'group', 'country', 'problem',
            'hand', 'part', 'place', 'case', 'week', 'company', 'where', 'system', 'program'
        ];

        // Palabras que indican otros idiomas (especialmente español)
        this.nonEnglishIndicators = [
            // Español
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'por', 'para',
            'con', 'sin', 'sobre', 'entre', 'desde', 'hasta', 'hacia', 'según', 'durante',
            'es', 'son', 'está', 'están', 'ser', 'estar', 'tener', 'hacer', 'poder', 'decir',
            'que', 'cual', 'quien', 'donde', 'cuando', 'como', 'porque', 'aunque', 'mientras',
            'esto', 'eso', 'aquello', 'estos', 'esas', 'aquellas', 'mi', 'tu', 'su', 'nuestro',
            'muy', 'más', 'menos', 'mucho', 'poco', 'bastante', 'demasiado', 'tanto', 'cuanto',
            'también', 'tampoco', 'además', 'incluso', 'solo', 'solamente', 'únicamente',
            'pero', 'sino', 'aunque', 'sin embargo', 'no obstante', 'por tanto', 'así que',
            // Otras palabras españolas comunes
            'gobierno', 'sociedad', 'educación', 'tecnología', 'trabajo', 'familia', 'persona',
            'importante', 'necesario', 'posible', 'diferente', 'social', 'económico', 'político'
        ];
    }

    // Detectar si el texto está en inglés
    detectLanguage(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);

        if (words.length < 10) {
            // Texto muy corto, difícil de determinar idioma
            return { isEnglish: true, confidence: 0.5, reason: 'Texto demasiado corto para determinar idioma' };
        }

        let englishScore = 0;
        let nonEnglishScore = 0;
        let totalWords = words.length;

        // Contar palabras en inglés
        words.forEach(word => {
            if (this.englishCommonWords.includes(word)) {
                englishScore += 1;
            }
            if (this.nonEnglishIndicators.includes(word)) {
                nonEnglishScore += 2; // Peso mayor para indicadores de otros idiomas
            }
        });

        const englishRatio = englishScore / totalWords;
        const nonEnglishRatio = nonEnglishScore / totalWords;

        // Determinar idioma basado en ratios
        if (nonEnglishRatio > 0.15) {
            return { 
                isEnglish: false, 
                confidence: Math.min(nonEnglishRatio * 2, 1.0),
                reason: `Detectadas ${Math.round(nonEnglishRatio * 100)}% palabras en otro idioma` 
            };
        }

        if (englishRatio < 0.1) {
            return { 
                isEnglish: false, 
                confidence: 0.7,
                reason: `Solo ${Math.round(englishRatio * 100)}% de palabras comunes en inglés detectadas` 
            };
        }

        return { 
            isEnglish: true, 
            confidence: Math.min(englishRatio * 2, 1.0),
            reason: `${Math.round(englishRatio * 100)}% de palabras comunes en inglés detectadas` 
        };
    }

    // Evaluar ajuste al tema específico
    evaluateTopicRelevance(essayText, topicData) {
        if (!topicData || !topicData.keywords || !topicData.concepts) {
            // Si no hay datos del tema, usar análisis básico
            return {
                relevanceScore: 0.5,
                keywordsFound: [],
                conceptsCovered: [],
                topicFocus: 'Medium',
                taskTypeAlignment: 'Unknown'
            };
        }

        const essayWords = essayText.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);

        // Buscar palabras clave del tema
        const keywordsFound = topicData.keywords.filter(keyword => 
            essayWords.some(word => 
                word.includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(word)
            )
        );

        // Buscar conceptos relacionados
        const conceptsCovered = topicData.concepts.filter(concept => {
            const conceptWords = concept.toLowerCase().split(' ');
            return conceptWords.some(conceptWord => 
                essayWords.some(essayWord => 
                    essayWord.includes(conceptWord) || 
                    conceptWord.includes(essayWord)
                )
            );
        });

        // Calcular puntuación de relevancia
        const keywordRatio = keywordsFound.length / topicData.keywords.length;
        const conceptRatio = conceptsCovered.length / topicData.concepts.length;
        const relevanceScore = (keywordRatio * 0.6 + conceptRatio * 0.4);

        // Determinar nivel de enfoque al tema
        let topicFocus;
        if (relevanceScore >= 0.6) topicFocus = 'High';
        else if (relevanceScore >= 0.3) topicFocus = 'Medium';
        else topicFocus = 'Low';

        // Evaluar alineación con tipo de tarea
        const taskTypeAlignment = this.evaluateTaskTypeAlignment(essayText, topicData.type);

        return {
            relevanceScore: Math.round(relevanceScore * 1000) / 1000,
            keywordsFound,
            conceptsCovered,
            topicFocus,
            taskTypeAlignment,
            keywordRatio: Math.round(keywordRatio * 100),
            conceptRatio: Math.round(conceptRatio * 100)
        };
    }

    // Evaluar si el ensayo responde al tipo de tarea correcta
    evaluateTaskTypeAlignment(essayText, taskType) {
        const textLower = essayText.toLowerCase();
        
        const patterns = {
            agree_disagree: {
                indicators: ['agree', 'disagree', 'i believe', 'in my opinion', 'i think', 'personally', 'from my perspective'],
                score: 0
            },
            advantages_disadvantages: {
                indicators: ['advantages', 'disadvantages', 'benefits', 'drawbacks', 'pros', 'cons', 'positive', 'negative'],
                score: 0
            },
            discuss_both_views: {
                indicators: ['on one hand', 'on the other hand', 'some people', 'others believe', 'both views', 'however', 'while'],
                score: 0
            },
            problem_solution: {
                indicators: ['problem', 'solution', 'solve', 'issue', 'challenge', 'address', 'tackle', 'resolve'],
                score: 0
            },
            positive_negative: {
                indicators: ['positive', 'negative', 'beneficial', 'harmful', 'good', 'bad', 'development'],
                score: 0
            }
        };

        // Contar indicadores para el tipo de tarea específico
        if (patterns[taskType]) {
            patterns[taskType].score = patterns[taskType].indicators.filter(indicator => 
                textLower.includes(indicator)
            ).length;
        }

        const matchingIndicators = patterns[taskType]?.score || 0;
        
        if (matchingIndicators >= 3) return 'Strong';
        else if (matchingIndicators >= 2) return 'Good';
        else if (matchingIndicators >= 1) return 'Weak';
        else return 'Poor';
    }

    evaluateEssay(essayText, topic = null, topicData = null) {
        try {
            // VALIDACIÓN DE IDIOMA INGLÉS
            const languageDetection = this.detectLanguage(essayText);
            
            if (!languageDetection.isEnglish) {
                return {
                    score: 0.0,
                    wordCount: essayText.split(/\s+/).filter(word => word.length > 0).length,
                    detailedScores: {
                        taskAchievement: 0.0,
                        coherenceCohesion: 0.0,
                        lexicalResource: 0.0,
                        grammaticalAccuracy: 0.0
                    },
                    feedback: {
                        general: `❌ ENSAYO RECHAZADO: El texto no está escrito en inglés. ${languageDetection.reason}`,
                        strengths: [],
                        improvements: [
                            "Escribir el ensayo completamente en inglés",
                            "Revisar que no haya palabras en español u otros idiomas",
                            "Usar vocabulario y gramática en inglés"
                        ]
                    },
                    languageDetection: languageDetection,
                    evaluatedAt: new Date().toISOString()
                };
            }

            // Si está en inglés, continuar con evaluación normal
            // Análisis básico del ensayo
            const analysis = this.analyzer.analyzeEssay(essayText, topic);
            
            // NUEVA: Análisis de relevancia al tema
            const topicRelevance = this.evaluateTopicRelevance(essayText, topicData);
            
            // Evaluación por criterios IELTS (MEJORADA con relevancia al tema)
            const scores = {
                taskAchievement: this.evaluateTaskAchievement(analysis, topic, topicRelevance),
                coherenceCohesion: this.evaluateCoherenceCohesion(analysis),
                lexicalResource: this.evaluateLexicalResource(analysis),
                grammaticalAccuracy: this.evaluateGrammaticalAccuracy(analysis)
            };
            
            // Calcular puntuación final
            const finalScore = this.calculateFinalScore(scores);
            
            // Generar feedback mejorado con información del tema
            const feedback = this.generateEnhancedFeedback(scores, analysis, topicRelevance);
            
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
                topicAnalysis: topicRelevance, // NUEVO: Análisis específico del tema
                evaluatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error en evaluación IELTS:', error);
            return this.getBasicEvaluation(essayText);
        }
    }

    evaluateTaskAchievement(analysis, topic, topicRelevance = null) {
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
        
        // NUEVO: Relevancia al tema (factor más importante)
        if (topicRelevance) {
            if (topicRelevance.relevanceScore >= 0.6) score += 1.0; // Muy relevante
            else if (topicRelevance.relevanceScore >= 0.4) score += 0.6; // Moderadamente relevante
            else if (topicRelevance.relevanceScore >= 0.2) score += 0.3; // Algo relevante
            else score -= 0.5; // Poco relevante al tema
            
            // Alineación con tipo de tarea
            switch (topicRelevance.taskTypeAlignment) {
                case 'Strong': score += 0.5; break;
                case 'Good': score += 0.3; break;
                case 'Weak': score += 0.1; break;
                case 'Poor': score -= 0.2; break;
            }
        }
        
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

    // Generar feedback mejorado con análisis del tema
    generateEnhancedFeedback(scores, analysis, topicRelevance) {
        const feedback = {
            general: this.getGeneralFeedback(scores),
            strengths: this.identifyEnhancedStrengths(scores, analysis, topicRelevance),
            improvements: this.identifyEnhancedImprovements(scores, analysis, topicRelevance),
            topicSpecific: this.getTopicSpecificFeedback(topicRelevance)
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

    identifyEnhancedStrengths(scores, analysis, topicRelevance) {
        const strengths = [];
        
        // Fortalezas existentes
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
        
        // NUEVAS: Fortalezas relacionadas con el tema
        if (topicRelevance) {
            if (topicRelevance.topicFocus === 'High') {
                strengths.push("Excelente enfoque en el tema principal");
            }
            if (topicRelevance.keywordRatio >= 40) {
                strengths.push("Buen uso de vocabulario específico del tema");
            }
            if (topicRelevance.taskTypeAlignment === 'Strong') {
                strengths.push("Responde correctamente al tipo de pregunta");
            }
        }
        
        return strengths.length > 0 ? strengths : ["El ensayo muestra esfuerzo en su desarrollo"];
    }

    identifyEnhancedImprovements(scores, analysis, topicRelevance) {
        const improvements = [];
        
        // Mejoras existentes
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
        
        // NUEVAS: Mejoras relacionadas con el tema
        if (topicRelevance) {
            if (topicRelevance.topicFocus === 'Low') {
                improvements.push("Enfocar más el ensayo en el tema principal");
            }
            if (topicRelevance.keywordRatio < 20) {
                improvements.push("Usar más vocabulario específico del tema");
            }
            if (topicRelevance.taskTypeAlignment === 'Poor' || topicRelevance.taskTypeAlignment === 'Weak') {
                improvements.push("Responder directamente al tipo de pregunta planteada");
            }
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

    getTopicSpecificFeedback(topicRelevance) {
        if (!topicRelevance) return null;
        
        return {
            relevanceLevel: topicRelevance.topicFocus,
            keywordsUsed: topicRelevance.keywordsFound.length,
            keywordsPercentage: topicRelevance.keywordRatio,
            conceptsCovered: topicRelevance.conceptsCovered.length,
            taskAlignment: topicRelevance.taskTypeAlignment,
            suggestions: this.generateTopicSuggestions(topicRelevance)
        };
    }

    generateTopicSuggestions(topicRelevance) {
        const suggestions = [];
        
        if (topicRelevance.keywordRatio < 30) {
            suggestions.push("Incluir más palabras clave relacionadas con el tema");
        }
        
        if (topicRelevance.conceptsCovered.length < 2) {
            suggestions.push("Desarrollar más conceptos relacionados con el tema");
        }
        
        if (topicRelevance.taskTypeAlignment === 'Poor') {
            suggestions.push("Asegurar que el ensayo responda al tipo específico de pregunta");
        }
        
        if (topicRelevance.topicFocus === 'Low') {
            suggestions.push("Mantener el enfoque en el tema central durante todo el ensayo");
        }
        
        return suggestions;
    }
}

module.exports = IELTSEvaluator;