import React, { useState, useEffect } from 'react';
import './App.css';

// Tipos TypeScript
interface TopicData {
  id: number;
  text: string;
  type: string;
  keywords: string[];
  concepts: string[];
}

interface EvaluationResult {
  score: number;
  wordCount: number;
  detailedScores: {
    taskAchievement: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalAccuracy: number;
  };
  feedback: {
    general: string;
    strengths: string[];
    improvements: string[];
    topicSpecific?: {
      relevanceLevel: string;
      keywordsUsed: number;
      keywordsPercentage: number;
      conceptsCovered: number;
      taskAlignment: string;
      suggestions: string[];
    };
  };
  topicAnalysis?: {
    relevanceScore: number;
    keywordsFound: string[];
    conceptsCovered: string[];
    topicFocus: string;
    taskTypeAlignment: string;
    keywordRatio: number;
    conceptRatio: number;
  };
}

interface TopicResponse {
  topic: string;
  topicId: number;
  topicData: TopicData;
  guidelines: {
    timeLimit: string;
    minWords: number;
    recommendedWords: string;
    taskType: string;
  };
}

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'writing' | 'results'>('welcome');
  const [topic, setTopic] = useState<string>('');
  const [topicData, setTopicData] = useState<TopicData | null>(null); 
  const [essay, setEssay] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); 
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Conteo de palabras en tiempo real
  const wordCount = essay.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Formatear tiempo en MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      // Opcional: evaluar automáticamente cuando se acabe el tiempo
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft]);

  // Obtener tema aleatorio
  const fetchTopic = async () => {
    try {
      setError('');
      const response = await fetch('http://localhost:5000/api/topic');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: TopicResponse = await response.json();
      setTopic(data.topic);
      setTopicData(data.topicData); // Guardar datos completos del tema
    } catch (error) {
      console.error('Error al obtener el tema:', error);
      setError('Error al cargar el tema. Por favor, verifica que el servidor esté funcionando.');
      setTopic('Error al cargar el tema. Por favor, recarga la página.');
    }
  };

  // Evaluar ensayo
  const evaluateEssay = async () => {
    if (wordCount < 250) {
      alert('El ensayo debe tener al menos 250 palabras.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          essay: essay,
          topic: topic,
          topicData: topicData // Enviar datos completos del tema para análisis
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: EvaluationResult = await response.json();
      console.log('Resultado de evaluación:', data); // Para debugging
      setResult(data);
      setCurrentScreen('results');
      setIsTimerActive(false);
    } catch (error) {
      console.error('Error al evaluar el ensayo:', error);
      setError('Error al evaluar el ensayo. Por favor, verifica que el servidor esté funcionando.');
      alert('Error al evaluar el ensayo. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar prueba
  const startTest = async () => {
    await fetchTopic();
    setCurrentScreen('writing');
    setIsTimerActive(true);
    setTimeLeft(30 * 60);
    setEssay('');
  };

  // Reiniciar prueba
  const resetTest = () => {
    setCurrentScreen('welcome');
    setTopic('');
    setTopicData(null); // Limpiar datos del tema
    setEssay('');
    setTimeLeft(30 * 60);
    setIsTimerActive(false);
    setResult(null);
  };

  // Pantalla de bienvenida
  if (currentScreen === 'welcome') {
    return (
      <div className="app">
        <div className="welcome-screen">
          <div className="welcome-card">
            <h1>🎓 IELTS Text writing test</h1>
            {error && (
              <div className="error-message" style={{color: 'red', margin: '10px 0'}}>
                ⚠️ {error}
              </div>
            )}
            <div className="instructions">
              <h2>Instrucciones</h2>
              <ul>
                <li>✏️ Tendrás<strong> 30 minutos</strong> para escribir un ensayo a partir de un<strong> tema aleatorio</strong></li>
                <li>📝 Con un mínimo de<strong> 250 palabras</strong> requeridas</li>
                <li>🎯 Serás evaluado<strong> en base a 5</strong></li>
                <li>✅ Necesitas<strong> 3 o más</strong> para aprobar</li>
              </ul>
            </div>
            <button className="start-button" onClick={startTest}>
              Comenzar Prueba
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de escritura
  if (currentScreen === 'writing') {
    const progressPercentage = Math.min((wordCount / 250) * 100, 100);
    const progressDegrees = (progressPercentage / 100) * 360;
    
    return (
      <div className="app">
        <div className="writing-screen">
          <div className="header">
            <div className="timer">
              <span className={`timer-text ${timeLeft <= 300 ? 'timer-warning' : ''}`}>
                ⏰ {formatTime(timeLeft)}
              </span>
            </div>
            <div className="word-counter">
              <span className={`word-count ${wordCount < 250 ? 'insufficient' : 'sufficient'}`}>
                📝 {wordCount}/250 palabras
              </span>
              <div 
                className="progress-circle" 
                style={{'--progress': `${progressDegrees}deg`} as React.CSSProperties}
                data-percentage={`${Math.round(progressPercentage)}%`}
              />
            </div>
          </div>
          
          <div className="writing-content">
            {timeLeft === 0 && (
              <div className="time-up-message">
                ⏰ ¡Se te acabó el tiempo! Suerte a la próxima. Puedes evaluar tu ensayo o intentar de nuevo.
              </div>
            )}
            
            <div className="topic-section">
              <h2>TEMA:</h2>
              <p className="topic-text">{topic}</p>
            </div>

            <div className="essay-section">
              <textarea
                className="essay-textarea"
                placeholder="Start typing here..."
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                disabled={timeLeft === 0}
              />
            </div>
          </div>

          <div className="actions">
            <button 
              className="evaluate-button"
              onClick={evaluateEssay}
              disabled={wordCount < 250 || isLoading}
              title={wordCount < 250 ? "Requiere 250 palabras" : ""}
            >
              {isLoading ? '⏳ Evaluando...' : '✅ Evaluar Ensayo'}
            </button>
            <button className="reset-button" onClick={resetTest}>
              🔄 Reiniciar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de resultados
  if (currentScreen === 'results' && result) {
    const status = result.score >= 3 ? 'Aprobado' : 'Necesita Mejorar';
    
    return (
      <div className="app">
        <div className="results-screen">
          <div className="results-card">
            <h1>📊 Resultados de tu Ensayo</h1>
            
            <div className="score-section">
              <div className={`score-display ${status === 'Aprobado' ? 'passed' : 'failed'}`}>
                <span className="score-number">{result.score}</span>
                <span className="score-total">/5</span>
              </div>
              <div className={`status ${status === 'Aprobado' ? 'passed' : 'failed'}`}>
                {status === 'Aprobado' ? '🎉' : '📚'} {status}
              </div>
            </div>

            <div className="detailed-scores">
              <h3>📋 Puntuaciones Detalladas:</h3>
              <div className="criteria-grid">
                <div className="criteria-item">
                  <span>Task Achievement:</span>
                  <span>{result.detailedScores.taskAchievement}/5</span>
                </div>
                <div className="criteria-item">
                  <span>Coherence & Cohesion:</span>
                  <span>{result.detailedScores.coherenceCohesion}/5</span>
                </div>
                <div className="criteria-item">
                  <span>Lexical Resource:</span>
                  <span>{result.detailedScores.lexicalResource}/5</span>
                </div>
                <div className="criteria-item">
                  <span>Grammatical Accuracy:</span>
                  <span>{result.detailedScores.grammaticalAccuracy}/5</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <div className="detail-item">
                <strong>📝 Palabras escritas:</strong> {result.wordCount}
              </div>
              
              <div className="detail-item">
                <strong>💬 Feedback General:</strong>
                <p className="feedback">{result.feedback.general}</p>
              </div>

              {result.feedback.strengths.length > 0 && (
                <div className="detail-item">
                  <strong>✅ Fortalezas:</strong>
                  <ul>
                    {result.feedback.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.feedback.improvements.length > 0 && (
                <div className="detail-item">
                  <strong>📈 Áreas de Mejora:</strong>
                  <ul>
                    {result.feedback.improvements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nuevo: Análisis de tema */}
              {result.topicAnalysis && (
                <div className="topic-analysis">
                  <h3>🔍 Análisis del Tema:</h3>
                  <div className="analysis-item">
                    <strong>Nivel de Relevancia:</strong> {result.topicAnalysis.relevanceScore}
                  </div>
                  <div className="analysis-item">
                    <strong>Enfoque del Tema:</strong> {result.topicAnalysis.topicFocus}
                  </div>
                  <div className="analysis-item">
                    <strong>Relación de Palabras Clave:</strong> {result.topicAnalysis.keywordRatio}
                  </div>
                  <div className="analysis-item">
                    <strong>Relación de Conceptos:</strong> {result.topicAnalysis.conceptRatio}
                  </div>
                </div>
              )}
            </div>

            <div className="actions">
              <button className="retry-button" onClick={resetTest}>
                🔄 Intentar de Nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si algo sale mal, mostrar mensaje de error
  if (currentScreen === 'results' && !result) {
    return (
      <div className="app">
        <div className="error-screen">
          <h2>❌ Error</h2>
          <p>No se pudieron cargar los resultados.</p>
          <button onClick={resetTest}>🔄 Volver al Inicio</button>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
