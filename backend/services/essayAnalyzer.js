class EssayAnalyzer {
    constructor() {
        this.academicConnectors = [
            'however', 'furthermore', 'moreover', 'nevertheless', 'consequently',
            'therefore', 'thus', 'hence', 'in addition', 'on the contrary',
            'conversely', 'likewise', 'similarly', 'in contrast', 'for instance',
            'specifically', 'namely', 'particularly', 'indeed', 'certainly'
        ];
        
        this.formalVocabulary = [
            'significant', 'substantial', 'considerable', 'demonstrate', 'illustrate',
            'indicate', 'suggest', 'reveal', 'emphasize', 'highlight', 'facilitate',
            'enhance', 'implement', 'establish', 'acquire', 'obtain', 'achieve',
            'individuals', 'citizens', 'society', 'community', 'phenomenon',
            'contemporary', 'prevalent', 'crucial', 'essential', 'fundamental'
        ];
        
        this.weakVocabulary = [
            'very', 'really', 'a lot', 'big', 'small', 'good', 'bad', 'nice',
            'thing', 'stuff', 'get', 'put', 'make', 'do', 'go', 'come'
        ];
    }

    analyzeEssay(essayText, topic = null) {
        const words = this.tokenizeWords(essayText);
        const sentences = this.splitSentences(essayText);
        const paragraphs = this.splitParagraphs(essayText);
        
        return {
            wordAnalysis: this.analyzeWords(words),
            sentenceAnalysis: this.analyzeSentences(sentences),
            paragraphAnalysis: this.analyzeParagraphs(paragraphs),
            vocabularyAnalysis: this.analyzeVocabulary(words),
            coherenceAnalysis: this.analyzeCoherence(essayText),
            grammarAnalysis: this.analyzeGrammarPatterns(essayText),
            structureAnalysis: this.analyzeStructure(paragraphs),
            topicRelevance: topic ? this.analyzeTopicRelevance(essayText, topic) : null
        };
    }

    tokenizeWords(text) {
        const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
        return cleanText.split(/\s+/).filter(word => word.trim().length > 0);
    }

    splitSentences(text) {
        return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    }

    splitParagraphs(text) {
        return text.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
    }

    analyzeWords(words) {
        if (words.length === 0) {
            return { totalWords: 0, uniqueWords: 0, avgWordLength: 0 };
        }

        const totalWords = words.length;
        const uniqueWords = new Set(words).size;
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / totalWords;
        
        const longWords = words.filter(word => word.length > 6);
        const longWordRatio = longWords.length / totalWords;

        return {
            totalWords,
            uniqueWords,
            lexicalDiversity: uniqueWords / totalWords,
            avgWordLength: Math.round(avgWordLength * 100) / 100,
            longWordsCount: longWords.length,
            longWordRatio: Math.round(longWordRatio * 1000) / 1000
        };
    }

    analyzeSentences(sentences) {
        if (sentences.length === 0) {
            return { totalSentences: 0, avgSentenceLength: 0 };
        }

        const totalSentences = sentences.length;
        const sentenceLengths = sentences.map(sent => sent.split(/\s+/).length);
        const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / totalSentences;
        
        const shortSentences = sentenceLengths.filter(len => len < 10).length;
        const mediumSentences = sentenceLengths.filter(len => len >= 10 && len <= 20).length;
        const longSentences = sentenceLengths.filter(len => len > 20).length;

        return {
            totalSentences,
            avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
            shortSentences,
            mediumSentences,
            longSentences,
            sentenceVarietyScore: this.calculateSentenceVariety(sentenceLengths)
        };
    }

    calculateSentenceVariety(lengths) {
        if (lengths.length < 2) return 0;
        
        const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
        const stdDev = Math.sqrt(variance);
        
        const normalizedVariety = mean > 0 ? Math.min(stdDev / mean, 1.0) : 0;
        return Math.round(normalizedVariety * 1000) / 1000;
    }

    analyzeParagraphs(paragraphs) {
        if (paragraphs.length === 0) {
            return { totalParagraphs: 0, avgParagraphLength: 0 };
        }

        const totalParagraphs = paragraphs.length;
        const paragraphLengths = paragraphs.map(para => para.split(/\s+/).length);
        const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / totalParagraphs;

        return {
            totalParagraphs,
            avgParagraphLength: Math.round(avgParagraphLength * 100) / 100,
            paragraphLengths,
            structureBalance: this.assessParagraphBalance(paragraphLengths)
        };
    }

    assessParagraphBalance(lengths) {
        if (lengths.length < 2) return 'Insufficient paragraphs';
        
        const minLength = Math.min(...lengths);
        const maxLength = Math.max(...lengths);
        
        if (minLength === 0) return 'Unbalanced (empty paragraphs)';
        
        const ratio = maxLength / minLength;
        
        if (ratio <= 2) return 'Well balanced';
        if (ratio <= 3) return 'Moderately balanced';
        return 'Unbalanced';
    }

    analyzeVocabulary(words) {
        if (words.length === 0) {
            return { academicConnectors: 0, formalVocabulary: 0, weakVocabulary: 0 };
        }

        const academicCount = words.filter(word => this.academicConnectors.includes(word)).length;
        const formalCount = words.filter(word => this.formalVocabulary.includes(word)).length;
        const weakCount = words.filter(word => this.weakVocabulary.includes(word)).length;

        // Contar frecuencia de palabras (excluyendo palabras funcionales)
        const functionWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 
                                     'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);
        
        const wordFreq = {};
        words.forEach(word => {
            if (!functionWords.has(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        const contentWords = Object.entries(wordFreq).filter(([word, count]) => count > 1);

        return {
            academicConnectors: academicCount,
            formalVocabulary: formalCount,
            weakVocabulary: weakCount,
            vocabularySophistication: this.calculateSophisticationScore(words),
            wordRepetition: contentWords.length,
            mostRepeatedContent: contentWords.slice(0, 5)
        };
    }

    calculateSophisticationScore(words) {
        if (words.length === 0) return 0;

        const totalWords = words.length;
        
        const academicPoints = words.filter(word => this.academicConnectors.includes(word)).length * 2;
        const formalPoints = words.filter(word => this.formalVocabulary.includes(word)).length * 1.5;
        const longWordPoints = words.filter(word => word.length > 7).length * 0.5;
        const weakPenalties = words.filter(word => this.weakVocabulary.includes(word)).length * -1;
        
        const totalPoints = academicPoints + formalPoints + longWordPoints + weakPenalties;
        const sophisticationScore = Math.max(0, (totalPoints / totalWords) * 10);
        
        return Math.round(Math.min(sophisticationScore, 10) * 100) / 100;
    }

    analyzeCoherence(text) {
        const textLower = text.toLowerCase();
        
        const contrastConnectors = ['however', 'nevertheless', 'on the contrary', 'conversely'];
        const additionConnectors = ['furthermore', 'moreover', 'in addition', 'additionally'];
        const causeEffectConnectors = ['therefore', 'consequently', 'thus', 'hence'];
        const exampleConnectors = ['for instance', 'for example', 'specifically', 'namely'];

        return {
            contrastConnectors: contrastConnectors.filter(conn => textLower.includes(conn)).length,
            additionConnectors: additionConnectors.filter(conn => textLower.includes(conn)).length,
            causeEffectConnectors: causeEffectConnectors.filter(conn => textLower.includes(conn)).length,
            exampleConnectors: exampleConnectors.filter(conn => textLower.includes(conn)).length,
            transitionVariety: this.assessTransitionVariety(textLower),
            pronounReference: this.analyzePronounReference(text)
        };
    }

    assessTransitionVariety(text) {
        const usedConnectors = this.academicConnectors.filter(conn => text.includes(conn));
        const varietyRatio = usedConnectors.length / this.academicConnectors.length;
        
        if (varietyRatio >= 0.3) return 'Excellent variety';
        if (varietyRatio >= 0.2) return 'Good variety';
        if (varietyRatio >= 0.1) return 'Moderate variety';
        return 'Limited variety';
    }

    analyzePronounReference(text) {
        const pronouns = ['this', 'that', 'these', 'those', 'it', 'they', 'them'];
        const pronounCount = {};
        
        pronouns.forEach(pronoun => {
            const regex = new RegExp(`\\b${pronoun}\\b`, 'gi');
            const matches = text.match(regex);
            pronounCount[pronoun] = matches ? matches.length : 0;
        });
        
        return pronounCount;
    }

    analyzeGrammarPatterns(text) {
        return {
            passiveVoice: (text.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/g) || []).length,
            conditionalStructures: (text.match(/\bif\b.*\b(would|could|might)\b/gi) || []).length,
            relativeClauses: (text.match(/\b(which|that|who|whom|whose)\b/gi) || []).length,
            gerunds: (text.match(/\b\w+ing\b/g) || []).length,
            modalVerbs: (text.match(/\b(should|would|could|might|may|must|can)\b/gi) || []).length
        };
    }

    analyzeStructure(paragraphs) {
        if (paragraphs.length < 3) {
            return {
                structureType: 'Insufficient paragraphs',
                hasIntroduction: false,
                hasConclusion: false,
                bodyParagraphs: paragraphs.length
            };
        }

        const introduction = paragraphs[0].toLowerCase();
        const conclusion = paragraphs[paragraphs.length - 1].toLowerCase();
        
        const introMarkers = ['believe', 'think', 'opinion', 'argue', 'essay', 'discuss'];
        const conclusionMarkers = ['conclusion', 'summary', 'overall', 'therefore', 'thus'];
        
        const hasIntroMarkers = introMarkers.some(marker => introduction.includes(marker));
        const hasConclusionMarkers = conclusionMarkers.some(marker => conclusion.includes(marker));

        return {
            structureType: paragraphs.length >= 4 ? 'Standard essay structure' : 'Basic structure',
            hasIntroduction: hasIntroMarkers,
            hasConclusion: hasConclusionMarkers,
            bodyParagraphs: Math.max(0, paragraphs.length - 2),
            introductionLength: introduction.split(/\s+/).length,
            conclusionLength: paragraphs.length > 1 ? conclusion.split(/\s+/).length : 0
        };
    }

    analyzeTopicRelevance(essayText, topic) {
        if (!topic) return { relevanceScore: 0, keyTermsUsed: [] };
        
        const topicWords = this.extractKeyTerms(topic);
        const essayWords = this.tokenizeWords(essayText);
        
        const usedKeyTerms = topicWords.filter(term => essayWords.includes(term));
        const relevanceScore = topicWords.length > 0 ? usedKeyTerms.length / topicWords.length : 0;
        
        return {
            relevanceScore: Math.round(relevanceScore * 1000) / 1000,
            keyTermsUsed: usedKeyTerms,
            totalKeyTerms: topicWords.length,
            topicFocus: relevanceScore > 0.6 ? 'High' : relevanceScore > 0.3 ? 'Medium' : 'Low'
        };
    }

    extractKeyTerms(topic) {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                                  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'do', 'does', 'did',
                                  'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might']);
        
        const words = this.tokenizeWords(topic);
        return words.filter(word => !stopWords.has(word) && word.length > 3);
    }
}

module.exports = EssayAnalyzer;