const EssayAnalyzer = require('./essayAnalyzer');

class IELTSEvaluator {
    constructor() {
        this.analyzer = new EssayAnalyzer();
        
        // Criterios oficiales IELTS con pesos iguales (25% cada uno)
        this.criteria = {
            taskAchievement: 0.25,
            coherenceCohesion: 0.25,
            lexicalResource: 0.25,
            grammaticalAccuracy: 0.25
        };

        // Descriptores oficiales de bandas IELTS (1-9)
        this.bandDescriptors = {
            taskAchievement: {
                9: "Respuesta completa a todas las partes de la tarea. Posición clara y bien desarrollada. Ideas relevantes y completamente extendidas.",
                8: "Respuesta suficiente a todas las partes de la tarea. Posición clara. Ideas bien desarrolladas con ejemplos relevantes.",
                7: "Aborda todas las partes aunque algunas más desarrolladas que otras. Posición clara. Ideas principales claras y apoyadas.",
                6: "Aborda todas las partes pero algunas insuficientemente. Posición relevante aunque no siempre clara. Ideas principales relevantes.",
                5: "Aborda la tarea solo parcialmente. Posición poco clara o desarrollada. Ideas limitadas y repetitivas.",
                4: "Respuesta tangencial o mínima. Posición confusa. Ideas irrelevantes o desarrolladas inadecuadamente.",
                3: "No aborda la tarea apropiadamente. Sin posición clara. Ideas confusas o irrelevantes.",
                2: "Intento mínimo de abordar la tarea. Sin desarrollo de ideas.",
                1: "No aborda la tarea. Contenido completamente irrelevante."
            },
            coherenceCohesion: {
                9: "Cohesión flexible y natural. Párrafos bien balanceados. Progresión clara sin esfuerzo aparente.",
                8: "Secuencia lógica. Párrafos apropiados. Conectores bien usados. Referencia clara y apropiada.",
                7: "Organización clara. Rango de conectores apropiados. Referencias claras y apropiadas.",
                6: "Información organizada coherentemente. Conectores efectivos. Referencias claras.",
                5: "Organización presente. Conectores inadecuados o repetitivos. Referencias pueden ser confusas.",
                4: "Información organizada pero sin progresión clara. Conectores básicos o inexactos.",
                3: "Organización confusa. Conectores limitados. Referencias poco claras.",
                2: "Poco control organizacional. Conectores mínimos.",
                1: "Sin organización evidente. Sin conectores apropiados."
            },
            lexicalResource: {
                9: "Rango completo y natural. Uso preciso y apropiado. Flexibilidad y control total.",
                8: "Amplio rango de vocabulario. Uso natural y sofisticado. Control de estilo y colocación.",
                7: "Rango suficiente. Flexibilidad y control preciso. Colocaciones apropiadas.",
                6: "Rango adecuado. Intenta vocabulario menos común. Errores ocasionales en elección de palabras.",
                5: "Rango limitado pero adecuado. Errores en vocabulario menos común. Repetición evidente.",
                4: "Rango limitado. Errores en vocabulario básico. Control inadecuado de formación de palabras.",
                3: "Rango muy limitado. Errores frecuentes que pueden impedir significado.",
                2: "Extremadamente limitado. Errores que impiden comunicación.",
                1: "Solo palabras aisladas o memorización de frases."
            },
            grammaticalAccuracy: {
                9: "Completo rango de estructuras. Completa flexibilidad y control preciso. Errores menores ocasionales.",
                8: "Amplio rango de estructuras. Flexibilidad y control preciso. Errores ocasionales 'deslices'.",
                7: "Rango de estructuras complejas. Control frecuente de gramática y puntuación. Errores ocasionales.",
                6: "Mezcla de estructuras simples y complejas. Flexibilidad limitada. Errores que no impiden comunicación.",
                5: "Rango limitado con solo estructuras simples frecuentemente correctas. Estructuras complejas con errores.",
                4: "Solo estructuras simples básicas. Errores frecuentes que pueden impedir significado.",
                3: "Estructuras básicas ocasionalmente correctas. Errores dominantes que dificultan significado.",
                2: "Solo patrones memorizados. Errores severos que impiden comunicación.",
                1: "Sin control gramatical evidente."
            }
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
            return { isEnglish: true, confidence: 0.5, reason: 'Texto demasiado corto para determinar idioma' };
        }

        let englishScore = 0;
        let nonEnglishScore = 0;
        let totalWords = words.length;

        words.forEach(word => {
            if (this.englishCommonWords.includes(word)) {
                englishScore += 1;
            }
            if (this.nonEnglishIndicators.includes(word)) {
                nonEnglishScore += 2;
            }
        });

        const englishRatio = englishScore / totalWords;
        const nonEnglishRatio = nonEnglishScore / totalWords;

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

        const keywordsFound = topicData.keywords.filter(keyword => 
            essayWords.some(word => 
                word.includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(word)
            )
        );

        const conceptsCovered = topicData.concepts.filter(concept => {
            const conceptWords = concept.toLowerCase().split(' ');
            return conceptWords.some(conceptWord => 
                essayWords.some(essayWord => 
                    essayWord.includes(conceptWord) || 
                    conceptWord.includes(essayWord)
                )
            );
        });

        const keywordRatio = keywordsFound.length / topicData.keywords.length;
        const conceptRatio = conceptsCovered.length / topicData.concepts.length;
        const relevanceScore = (keywordRatio * 0.6 + conceptRatio * 0.4);

        let topicFocus;
        if (relevanceScore >= 0.6) topicFocus = 'High';
        else if (relevanceScore >= 0.3) topicFocus = 'Medium';
        else topicFocus = 'Low';

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
                    band: "0.0",
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

            // Análisis básico del ensayo
            const analysis = this.analyzer.analyzeEssay(essayText, topic);
            
            // Análisis de relevancia al tema
            const topicRelevance = this.evaluateTopicRelevance(essayText, topicData);
            
            // Evaluación por criterios IELTS con bandas 1-9
            const bandScores = {
                taskAchievement: this.evaluateTaskAchievement(analysis, topic, topicRelevance),
                coherenceCohesion: this.evaluateCoherenceCohesion(analysis),
                lexicalResource: this.evaluateLexicalResource(analysis),
                grammaticalAccuracy: this.evaluateGrammaticalAccuracy(analysis)
            };
            
            // Calcular banda final (promedio de los 4 criterios)
            const finalBand = this.calculateFinalBand(bandScores);
            
            // Generar retroalimentación específica del IELTS
            const feedback = this.generateIELTSFeedback(bandScores, analysis, topicRelevance);
            
            return {
                score: finalBand, // Mantenemos para compatibilidad
                band: this.formatBand(finalBand),
                wordCount: analysis.wordAnalysis.totalWords,
                detailedScores: {
                    taskAchievement: this.formatBand(bandScores.taskAchievement),
                    coherenceCohesion: this.formatBand(bandScores.coherenceCohesion),
                    lexicalResource: this.formatBand(bandScores.lexicalResource),
                    grammaticalAccuracy: this.formatBand(bandScores.grammaticalAccuracy)
                },
                bandDescriptions: this.getBandDescriptions(bandScores),
                feedback,
                topicAnalysis: topicRelevance,
                evaluatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error en evaluación IELTS:', error);
            return this.getBasicEvaluation(essayText);
        }
    }

    // NUEVAS FUNCIONES DE EVALUACIÓN CON BANDAS 1-9

    evaluateTaskAchievement(analysis, topic, topicRelevance = null) {
        let band = 1.0;
        const wordCount = analysis.wordAnalysis.totalWords;
        const structure = analysis.structureAnalysis;
        
        // Penalización severa por menos de 250 palabras (-1 banda)
        if (wordCount < 250) {
            band = Math.max(1.0, band - 1.0);
        }
        
        // Criterios básicos de Task Achievement
        if (wordCount >= 250) band = 4.0; // Cumple mínimo
        if (wordCount >= 280) band = 5.0; // Desarrollo adecuado
        
        // Estructura y organización
        if (structure.hasIntroduction && structure.hasConclusion) {
            band += 1.0;
        }
        if (analysis.paragraphAnalysis.totalParagraphs >= 4) {
            band += 0.5;
        }
        
        // Relevancia al tema (factor crítico)
        if (topicRelevance) {
            if (topicRelevance.relevanceScore >= 0.7) band += 1.5; // Excelente relevancia
            else if (topicRelevance.relevanceScore >= 0.5) band += 1.0; // Buena relevancia
            else if (topicRelevance.relevanceScore >= 0.3) band += 0.5; // Relevancia básica
            else band -= 1.0; // Poco relevante (-0.5 banda)
            
            // Alineación con tipo de tarea
            switch (topicRelevance.taskTypeAlignment) {
                case 'Strong': band += 1.0; break;
                case 'Good': band += 0.5; break;
                case 'Weak': break;
                case 'Poor': band -= 0.5; break;
            }
        }
        
        return Math.min(9.0, Math.max(1.0, band));
    }

    evaluateCoherenceCohesion(analysis) {
        let band = 3.0; // Base para ensayos con estructura básica
        
        const coherence = analysis.coherenceAnalysis;
        const totalConnectors = coherence.contrastConnectors + coherence.additionConnectors + 
                               coherence.causeEffectConnectors + coherence.exampleConnectors;
        
        // Uso de conectores académicos
        if (totalConnectors >= 6) band = 7.0; // Rango apropiado de conectores
        else if (totalConnectors >= 4) band = 6.0; // Conectores efectivos
        else if (totalConnectors >= 2) band = 5.0; // Conectores básicos
        else if (totalConnectors >= 1) band = 4.0; // Conectores limitados
        
        // Variedad de conectores
        if (coherence.transitionVariety === 'Excellent variety') band += 1.0;
        else if (coherence.transitionVariety === 'Good variety') band += 0.5;
        else if (coherence.transitionVariety === 'Limited variety') band -= 0.5;
        
        // Balance de párrafos
        if (analysis.paragraphAnalysis.structureBalance === 'Well balanced') band += 0.5;
        else if (analysis.paragraphAnalysis.structureBalance === 'Unbalanced') band -= 1.0;
        
        // Referencias pronominales (cohesión)
        const pronouns = Object.values(coherence.pronounReference).reduce((a, b) => a + b, 0);
        if (pronouns >= 8) band += 0.5; // Buen uso de referencias
        
        return Math.min(9.0, Math.max(1.0, band));
    }

    evaluateLexicalResource(analysis) {
        let band = 3.0;
        
        const vocabulary = analysis.vocabularyAnalysis;
        const words = analysis.wordAnalysis;
        
        // Diversidad léxica
        if (words.lexicalDiversity >= 0.7) band = 8.0; // Rango amplio
        else if (words.lexicalDiversity >= 0.6) band = 7.0; // Rango suficiente
        else if (words.lexicalDiversity >= 0.5) band = 6.0; // Rango adecuado
        else if (words.lexicalDiversity >= 0.4) band = 5.0; // Rango limitado
        else if (words.lexicalDiversity >= 0.3) band = 4.0; // Rango muy limitado
        
        // Vocabulario formal y académico
        if (vocabulary.formalVocabulary >= 8) band += 1.0; // Uso natural y sofisticado
        else if (vocabulary.formalVocabulary >= 5) band += 0.5; // Buen uso
        else if (vocabulary.formalVocabulary >= 3) band += 0.2; // Uso básico
        
        // Penalización por vocabulario débil (ej: 'ageing population' vs 'old people')
        if (vocabulary.weakVocabulary >= 5) band -= 1.0;
        else if (vocabulary.weakVocabulary >= 3) band -= 0.5;
        
        // Repetición excesiva (evitar "problem" 4 veces)
        if (vocabulary.wordRepetition >= 8) band -= 0.5;
        
        // Conectores académicos (however, furthermore, consequently)
        if (vocabulary.academicConnectors >= 4) band += 0.5;
        
        return Math.min(9.0, Math.max(1.0, band));
    }

    evaluateGrammaticalAccuracy(analysis) {
        let band = 3.0;
        
        const grammar = analysis.grammarAnalysis;
        const sentences = analysis.sentenceAnalysis;
        
        // Variedad de estructuras
        if (sentences.avgSentenceLength >= 18) band = 6.0; // Mezcla de estructuras
        else if (sentences.avgSentenceLength >= 15) band = 5.0; // Algunas estructuras complejas
        else if (sentences.avgSentenceLength >= 12) band = 4.0; // Principalmente simples
        
        // Estructuras complejas (condicionales, pasivas, cláusulas relativas)
        const complexStructures = grammar.conditionalStructures + grammar.passiveVoice + grammar.relativeClauses;
        if (complexStructures >= 8) band += 2.0; // Amplio rango
        else if (complexStructures >= 5) band += 1.5; // Buen rango
        else if (complexStructures >= 3) band += 1.0; // Estructuras básicas
        else if (complexStructures >= 1) band += 0.5; // Intentos de complejidad
        
        // Voz pasiva (benefits are threatened)
        if (grammar.passiveVoice >= 3) band += 0.5;
        
        // Verbos modales para flexibilidad
        if (grammar.modalVerbs >= 5) band += 0.5;
        
        // Variedad de oraciones
        if (sentences.sentenceVarietyScore >= 0.4) band += 0.5; // Buena variedad
        else if (sentences.sentenceVarietyScore < 0.2) band -= 0.5; // Poca variedad
        
        return Math.min(9.0, Math.max(1.0, band));
    }

    calculateFinalBand(bandScores) {
        // Promedio de los 4 criterios (peso igual 25% cada uno)
        return (bandScores.taskAchievement + bandScores.coherenceCohesion + 
                bandScores.lexicalResource + bandScores.grammaticalAccuracy) / 4;
    }

    formatBand(band) {
        // Formatear a .0 o .5 como en IELTS real
        const rounded = Math.round(band * 2) / 2;
        return rounded % 1 === 0 ? `${rounded.toFixed(1)}` : `${rounded.toFixed(1)}`;
    }

    getBandDescriptions(bandScores) {
        const descriptions = {};
        Object.keys(bandScores).forEach(criterion => {
            const band = Math.round(bandScores[criterion]);
            descriptions[criterion] = this.bandDescriptors[criterion][band] || 
                                     this.bandDescriptors[criterion][5]; // Default a banda 5
        });
        return descriptions;
    }

    // Generar retroalimentación alineada al IELTS
    generateIELTSFeedback(bandScores, analysis, topicRelevance) {
        const overallBand = this.calculateFinalBand(bandScores);
        
        return {
            general: this.getOverallBandComment(overallBand),
            criteriaFeedback: this.generateCriteriaFeedback(bandScores, analysis, topicRelevance),
            keyRecommendations: this.generateKeyRecommendations(bandScores, analysis),
            nextSteps: this.getNextSteps(overallBand)
        };
    }

    getOverallBandComment(band) {
        if (band >= 8.0) return `**Overall Band: ${this.formatBand(band)}** - Excelente nivel. Listo para examen oficial.`;
        else if (band >= 7.0) return `**Overall Band: ${this.formatBand(band)}** - Buen nivel competente. Cerca del objetivo.`;
        else if (band >= 6.0) return `**Overall Band: ${this.formatBand(band)}** - Nivel competente con áreas de mejora específicas.`;
        else if (band >= 5.0) return `**Overall Band: ${this.formatBand(band)}** - Nivel moderado. Requiere práctica en criterios clave.`;
        else if (band >= 4.0) return `**Overall Band: ${this.formatBand(band)}** - Nivel limitado. Enfócate en fundamentos.`;
        else return `**Overall Band: ${this.formatBand(band)}** - Requiere trabajo significativo en todos los aspectos.`;
    }

    generateCriteriaFeedback(bandScores, analysis, topicRelevance) {
        const feedback = {};
        
        // Task Achievement
        const taBand = bandScores.taskAchievement;
        if (taBand >= 7.0) {
            feedback.taskAchievement = `✓ **Band ${this.formatBand(taBand)}**: Respuesta completa y bien desarrollada`;
        } else if (taBand >= 6.0) {
            feedback.taskAchievement = `⚠ **Band ${this.formatBand(taBand)}**: Aborda la tarea pero necesita más desarrollo`;
        } else {
            feedback.taskAchievement = `✗ **Band ${this.formatBand(taBand)}**: Respuesta limitada o irrelevante`;
        }
        
        if (analysis.wordAnalysis.totalWords < 250) {
            feedback.taskAchievement += `\n✗ Menos de 250 palabras (-1 banda penalización)`;
        }
        
        if (topicRelevance && topicRelevance.topicFocus === 'Low') {
            feedback.taskAchievement += `\n✗ Falta enfoque en el tema principal`;
        }

        // Coherence & Cohesion
        const ccBand = bandScores.coherenceCohesion;
        if (ccBand >= 7.0) {
            feedback.coherenceCohesion = `✓ **Band ${this.formatBand(ccBand)}**: Organización clara con conectores efectivos`;
        } else if (ccBand >= 6.0) {
            feedback.coherenceCohesion = `⚠ **Band ${this.formatBand(ccBand)}**: Organización presente, mejora conectores`;
        } else {
            feedback.coherenceCohesion = `✗ **Band ${this.formatBand(ccBand)}**: Organización confusa, conectores limitados`;
        }
        
        const coherence = analysis.coherenceAnalysis;
        const totalConnectors = coherence.contrastConnectors + coherence.additionConnectors + 
                               coherence.causeEffectConnectors + coherence.exampleConnectors;
        
        if (totalConnectors < 3) {
            feedback.coherenceCohesion += `\n✗ Usa más conectores (*However*, *Furthermore*, *Therefore*)`;
        }

        // Lexical Resource
        const lrBand = bandScores.lexicalResource;
        if (lrBand >= 7.0) {
            feedback.lexicalResource = `✓ **Band ${this.formatBand(lrBand)}**: Vocabulario amplio y preciso`;
        } else if (lrBand >= 6.0) {
            feedback.lexicalResource = `⚠ **Band ${this.formatBand(lrBand)}**: Vocabulario adecuado, intenta términos más académicos`;
        } else {
            feedback.lexicalResource = `✗ **Band ${this.formatBand(lrBand)}**: Vocabulario limitado y repetitivo`;
        }
        
        if (analysis.vocabularyAnalysis.weakVocabulary >= 3) {
            feedback.lexicalResource += `\n✗ Evita palabras básicas → Usa términos académicos`;
        }
        
        if (analysis.vocabularyAnalysis.wordRepetition >= 5) {
            feedback.lexicalResource += `\n✗ Reduce repetición → Usar sinónimos (challenge/issue/dilemma)`;
        }

        // Grammatical Range & Accuracy
        const grBand = bandScores.grammaticalAccuracy;
        if (grBand >= 7.0) {
            feedback.grammaticalAccuracy = `✓ **Band ${this.formatBand(grBand)}**: Buen rango de estructuras complejas`;
        } else if (grBand >= 6.0) {
            feedback.grammaticalAccuracy = `⚠ **Band ${this.formatBand(grBand)}**: Mezcla estructuras, errores ocasionales`;
        } else {
            feedback.grammaticalAccuracy = `✗ **Band ${this.formatBand(grBand)}**: Estructuras limitadas, errores frecuentes`;
        }
        
        const grammar = analysis.grammarAnalysis;
        if (grammar.passiveVoice < 2) {
            feedback.grammaticalAccuracy += `\n✗ Practica voz pasiva (*benefits **are threatened***)`; 
        }
        
        if (grammar.conditionalStructures < 1) {
            feedback.grammaticalAccuracy += `\n✗ Incluye condicionales (*If governments **invested**...*)`;
        }

        return feedback;
    }

    generateKeyRecommendations(bandScores, analysis) {
        const recommendations = [];
        
        // Encontrar el criterio más débil
        const minCriterion = Object.keys(bandScores).reduce((a, b) => 
            bandScores[a] < bandScores[b] ? a : b);
        
        const minBand = bandScores[minCriterion];
        
        if (minCriterion === 'taskAchievement' && minBand < 6.0) {
            recommendations.push("📝 **Prioridad 1**: Responder directamente todas las partes de la pregunta");
            recommendations.push("🎯 Incluir ejemplos específicos para cada argumento principal");
        }
        
        if (minCriterion === 'coherenceCohesion' && minBand < 6.0) {
            recommendations.push("🔗 **Prioridad 1**: Usar conectores académicos variados (*However*, *Furthermore*, *Consequently*)");
            recommendations.push("📐 Estructurar párrafos con una idea central clara");
        }
        
        if (minCriterion === 'lexicalResource' && minBand < 6.0) {
            recommendations.push("📚 **Prioridad 1**: Reemplazar vocabulario básico por términos académicos");
            recommendations.push("🔄 Evitar repetición excesiva de palabras clave");
        }
        
        if (minCriterion === 'grammaticalAccuracy' && minBand < 6.0) {
            recommendations.push("⚙️ **Prioridad 1**: Practicar estructuras complejas (condicionales, pasivas)");
            recommendations.push("✏️ Revisar concordancia sujeto-verbo antes de enviar");
        }
        
        // Recomendación general de longitud
        if (analysis.wordAnalysis.totalWords < 280) {
            recommendations.push("📏 Objetivo: 280-320 palabras para desarrollo completo");
        }
        
        return recommendations;
    }

    getNextSteps(band) {
        if (band >= 7.5) {
            return [
                "🎯 Mantener este excelente nivel con práctica regular",
                "📚 Enfocarse en pulir detalles menores",
                "✅ Listo para tomar el examen oficial IELTS"
            ];
        } else if (band >= 6.5) {
            return [
                "📈 Muy cerca del objetivo. Continuar con práctica específica",
                "🔍 Pulir el criterio más débil identificado arriba",
                "⏰ Practicar escritura bajo presión de tiempo"
            ];
        } else if (band >= 5.5) {
            return [
                "📚 Estudiar descriptores de banda IELTS específicos",
                "💪 Enfocarse en los 2 criterios más débiles",
                "📝 Practicar diferentes tipos de ensayos Task 2"
            ];
        } else {
            return [
                "🔤 Revisar gramática y vocabulario fundamental",
                "📖 Leer ensayos modelo de banda 6-7",
                "⌚ Considerear curso preparatorio IELTS"
            ];
        }
    }

    getBasicEvaluation(essayText) {
        const wordCount = essayText.split(/\s+/).length;
        
        return {
            score: 2.0,
            band: "2.0",
            wordCount,
            detailedScores: {
                taskAchievement: "2.0",
                coherenceCohesion: "2.0",
                lexicalResource: "2.0",
                grammaticalAccuracy: "2.0"
            },
            feedback: {
                general: "Error en el análisis. Puntuación básica asignada.",
                criteriaFeedback: {
                    taskAchievement: "Error en evaluación",
                    coherenceCohesion: "Error en evaluación", 
                    lexicalResource: "Error en evaluación",
                    grammaticalAccuracy: "Error en evaluación"
                },
                keyRecommendations: ["Revisar contenido y estructura"],
                nextSteps: ["Intentar nuevamente"]
            },
            evaluatedAt: new Date().toISOString()
        };
    }
}

module.exports = IELTSEvaluator;