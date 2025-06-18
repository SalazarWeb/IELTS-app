const fs = require('fs');
const path = require('path');

class UserManager {
    constructor() {
        this.usersFile = path.join(__dirname, '../data/users.json');
        this.ensureDataDirectory();
        this.users = this.loadUsers();
    }

    ensureDataDirectory() {
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    loadUsers() {
        try {
            if (fs.existsSync(this.usersFile)) {
                const data = fs.readFileSync(this.usersFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
        return {};
    }

    saveUsers() {
        try {
            fs.writeFileSync(this.usersFile, JSON.stringify(this.users, null, 2));
        } catch (error) {
            console.error('Error guardando usuarios:', error);
        }
    }

    getOrCreateUser(userId) {
        const userIdStr = String(userId);
        
        if (!this.users[userIdStr]) {
            this.users[userIdStr] = {
                userId: userIdStr,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                essayHistory: [],
                currentTopic: null,
                totalEssays: 0,
                averageScore: 0,
                bestScore: 0,
                preferences: {
                    language: 'es',
                    notificationEnabled: true,
                    preferredTopics: []
                },
                statistics: {
                    totalPracticeTime: 0,
                    activeDays: 0,
                    improvementAreas: [],
                    strengths: []
                }
            };
            this.saveUsers();
        }

        // Actualizar última actividad
        this.users[userIdStr].lastActive = new Date().toISOString();
        return this.users[userIdStr];
    }

    setCurrentTopic(userId, topic) {
        const user = this.getOrCreateUser(userId);
        user.currentTopic = topic;
        user.topicAssignedAt = new Date().toISOString();
        this.saveUsers();
    }

    getCurrentTopic(userId) {
        const user = this.getOrCreateUser(userId);
        return user.currentTopic;
    }

    addEssayToHistory(userId, essayText, topic, evaluation) {
        const user = this.getOrCreateUser(userId);
        
        const essayEntry = {
            date: new Date().toISOString(),
            essayText,
            topic,
            wordCount: essayText.split(/\s+/).length,
            evaluation,
            score: evaluation.score || 0,
            detailedScores: evaluation.detailedScores || {}
        };

        user.essayHistory.push(essayEntry);
        user.totalEssays = user.essayHistory.length;

        // Actualizar estadísticas
        this.updateUserStatistics(userId, essayEntry);
        this.saveUsers();
    }

    updateUserStatistics(userId, essayEntry) {
        const user = this.users[String(userId)];
        const history = user.essayHistory;

        // Calcular puntuación promedio
        if (history.length > 0) {
            const scores = history.map(entry => entry.score || 0).filter(score => score > 0);
            user.averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            user.bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        }

        // Actualizar días activos
        const uniqueDates = new Set();
        history.forEach(entry => {
            const dateStr = entry.date.split('T')[0];
            uniqueDates.add(dateStr);
        });
        user.statistics.activeDays = uniqueDates.size;
    }

    getUserStatistics(userId) {
        const user = this.getOrCreateUser(userId);
        const history = user.essayHistory || [];

        if (history.length === 0) {
            return {
                totalEssays: 0,
                averageScore: 0,
                bestScore: 0,
                trend: 'Sin datos',
                improvementArea: 'General',
                strengthArea: 'General',
                avgTaskAchievement: 0,
                avgCoherence: 0,
                avgLexical: 0,
                avgGrammar: 0,
                activeDays: 0,
                totalPracticeTime: '0 horas'
            };
        }

        const scores = history.map(entry => entry.score || 0);
        const totalEssays = history.length;
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const bestScore = Math.max(...scores);

        // Calcular tendencia
        let trend = 'Estable';
        if (scores.length >= 3) {
            const recentAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
            if (scores.length >= 6) {
                const olderAvg = scores.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
                if (recentAvg > olderAvg + 0.3) {
                    trend = 'Mejorando';
                } else if (recentAvg < olderAvg - 0.3) {
                    trend = 'Necesita práctica';
                }
            }
        }

        // Análisis por criterios
        const criteriaScores = {
            taskAchievement: [],
            coherenceCohesion: [],
            lexicalResource: [],
            grammaticalAccuracy: []
        };

        history.forEach(entry => {
            const detailed = entry.detailedScores || {};
            Object.keys(criteriaScores).forEach(criterion => {
                if (detailed[criterion]) {
                    criteriaScores[criterion].push(detailed[criterion]);
                }
            });
        });

        const avgCriteria = {};
        Object.keys(criteriaScores).forEach(criterion => {
            const scores = criteriaScores[criterion];
            avgCriteria[criterion] = scores.length > 0 ? 
                scores.reduce((a, b) => a + b, 0) / scores.length : averageScore;
        });

        // Identificar área de mejora y fortaleza
        const criterionNames = {
            taskAchievement: 'Task Achievement',
            coherenceCohesion: 'Coherence & Cohesion',
            lexicalResource: 'Lexical Resource',
            grammaticalAccuracy: 'Grammatical Accuracy'
        };

        let improvementArea = 'Task Achievement';
        let strengthArea = 'General';

        if (Object.keys(avgCriteria).length > 0) {
            const minCriterion = Object.keys(avgCriteria).reduce((a, b) => 
                avgCriteria[a] < avgCriteria[b] ? a : b);
            const maxCriterion = Object.keys(avgCriteria).reduce((a, b) => 
                avgCriteria[a] > avgCriteria[b] ? a : b);
            
            improvementArea = criterionNames[minCriterion];
            strengthArea = criterionNames[maxCriterion];
        }

        return {
            totalEssays,
            averageScore: Math.round(averageScore * 10) / 10,
            bestScore: Math.round(bestScore * 10) / 10,
            trend,
            improvementArea,
            strengthArea,
            avgTaskAchievement: Math.round((avgCriteria.taskAchievement || 0) * 10) / 10,
            avgCoherence: Math.round((avgCriteria.coherenceCohesion || 0) * 10) / 10,
            avgLexical: Math.round((avgCriteria.lexicalResource || 0) * 10) / 10,
            avgGrammar: Math.round((avgCriteria.grammaticalAccuracy || 0) * 10) / 10,
            activeDays: user.statistics.activeDays,
            totalPracticeTime: `${Math.round(totalEssays * 40 / 60 * 10) / 10} horas`
        };
    }

    getUserHistory(userId) {
        const user = this.getOrCreateUser(userId);
        return user.essayHistory || [];
    }
}

module.exports = UserManager;