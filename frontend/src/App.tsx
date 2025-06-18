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
  band: string;
  wordCount: number;
  detailedScores: {
    taskAchievement: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalAccuracy: string;
  };
  bandDescriptions?: {
    taskAchievement: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalAccuracy: string;
  };
  feedback: {
    general: string;
    criteriaFeedback?: {
      taskAchievement: string;
      coherenceCohesion: string;
      lexicalResource: string;
      grammaticalAccuracy: string;
    };
    keyRecommendations?: string[];
    nextSteps?: string[];
    // Compatibilidad con formato anterior
    strengths?: string[];
    improvements?: string[];
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
  const [timeLeft, setTimeLeft] = useState<number>(40 * 60); // Cambiado de 30 a 40 minutos
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

  // Función para obtener el color de la banda IELTS
  const getBandColor = (band: string): string => {
    const bandNum = parseFloat(band);
    if (bandNum >= 8.0) return '#10B981'; // Verde excelente
    else if (bandNum >= 7.0) return '#059669'; // Verde bueno  
    else if (bandNum >= 6.0) return '#3B82F6'; // Azul competente
    else if (bandNum >= 5.0) return '#F59E0B'; // Amarillo moderado
    else if (bandNum >= 4.0) return '#EF4444'; // Rojo limitado
    else return '#6B7280'; // Gris muy limitado
  };

  // Función para obtener descripción de la banda
  const getBandDescription = (band: string): string => {
    const bandNum = parseFloat(band);
    if (bandNum >= 8.0) return 'Excelente';
    else if (bandNum >= 7.0) return 'Competente Alto';
    else if (bandNum >= 6.0) return 'Competente';
    else if (bandNum >= 5.0) return 'Moderado';
    else if (bandNum >= 4.0) return 'Limitado';
    else return 'Muy Limitado';
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
      setTopicData(data.topicData);
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
          topicData: topicData
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: EvaluationResult = await response.json();
      console.log('Resultado de evaluación:', data);
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
    setTimeLeft(40 * 60); // Cambiado de 30 a 40 minutos
    setEssay('');
  };

  // Reiniciar prueba
  const resetTest = () => {
    setCurrentScreen('welcome');
    setTopic('');
    setTopicData(null);
    setEssay('');
    setTimeLeft(40 * 60); // Cambiado de 30 a 40 minutos
    setIsTimerActive(false);
    setResult(null);
  };

  // Pantalla de bienvenida
  if (currentScreen === 'welcome') {
    return (
      <div className="app">
        <div className="welcome-screen">
          <div className="welcome-card">
            <h1>🎓 IELTS Writing Test</h1>
            {error && (
              <div className="error-message" style={{color: 'red', margin: '10px 0'}}>
                ⚠️ {error}
              </div>
            )}
            <div className="instructions">
              <h2>Evaluación Oficial IELTS</h2>
              <ul>
                <li>📊 <strong>4 Criterios Oficiales:</strong> Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy</li>
                <li>⭐ <strong>Bandas 1-9:</strong> Evaluación con bandas oficiales IELTS (5.0, 5.5, 6.0, etc.)</li>
                <li>⏰ <strong>40 minutos</strong> para escribir mínimo <strong>250 palabras</strong></li>
                <li>🎯 <strong>Retroalimentación detallada</strong> con recomendaciones específicas</li>
                <li>📝 <strong>Penalizaciones:</strong> -1 banda por menos de 250 palabras</li>
              </ul>
            </div>
            <button className="start-button" onClick={startTest}>
              Comenzar Evaluación IELTS
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
                {wordCount < 250 && <small style={{display: 'block', fontSize: '0.8em'}}>(-1 banda penalización)</small>}
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
                ⏰ ¡Se acabó el tiempo! Puedes evaluar tu ensayo o reiniciar.
              </div>
            )}
            
            <div className="topic-section">
              <h2>IELTS Topic</h2>
              <p className="topic-text">{topic}</p>
              {topicData && (
                <div style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                  <strong>Tipo:</strong> {topicData.type.replace(/_/g, ' ')} | 
                  <strong> Tiempo:</strong> 40 min recomendados | 
                  <strong> Palabras:</strong> 280-320 ideales
                </div>
              )}
            </div>

            <div className="essay-section">
              <textarea
                className="essay-textarea"
                placeholder="Start writing your IELTS essay here... Remember to address all parts of the question, use formal academic language, and include specific examples to support your arguments."
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
              title={wordCount < 250 ? "Requiere 250 palabras mínimo" : ""}
            >
              {isLoading ? '⏳ Evaluando con Criterios IELTS...' : '📊 Evaluar con Bandas IELTS'}
            </button>
            <button className="reset-button" onClick={resetTest}>
              🔄 Reiniciar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de resultados con nuevo formato IELTS
  if (currentScreen === 'results' && result) {
    const overallBand = parseFloat(result.band || result.score.toString());
    const isApproved = overallBand >= 6.0; // Banda 6.0+ generalmente aceptable
    
    return (
      <div className="app">
        <div className="results-screen">
          <div className="results-card">
            <h1>🏆 IELTS Writing Evaluation</h1>
            
            {/* Banda general */}
            <div className="score-section">
              <div 
                className="ielts-band-display"
                style={{
                  backgroundColor: getBandColor(result.band || result.score.toString()),
                  color: 'white',
                  padding: '20px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}
              >
                <div style={{fontSize: '3rem', fontWeight: 'bold'}}>
                  Band {result.band || result.score.toFixed(1)}
                </div>
                <div style={{fontSize: '1.2rem', marginTop: '5px'}}>
                  {getBandDescription(result.band || result.score.toString())}
                </div>
              </div>
              
              <div className={`status ${isApproved ? 'passed' : 'failed'}`}>
                {isApproved ? '✅ Competente para uso académico' : '📚 Requiere mejora para estándar IELTS'}
              </div>
            </div>

            {/* Puntuaciones detalladas por criterio */}
            <div className="detailed-scores">
              <h3>📋 Criterios IELTS (25% cada uno):</h3>
              <div className="criteria-grid-ielts">
                <div className="criteria-item-ielts">
                  <div className="criteria-header">
                    <strong>Task Achievement</strong>
                    <span 
                      className="band-score"
                      style={{color: getBandColor(result.detailedScores.taskAchievement)}}
                    >
                      Band {result.detailedScores.taskAchievement}
                    </span>
                  </div>
                  {result.bandDescriptions && (
                    <div className="criteria-description">
                      {result.bandDescriptions.taskAchievement}
                    </div>
                  )}
                </div>
                
                <div className="criteria-item-ielts">
                  <div className="criteria-header">
                    <strong>Coherence & Cohesion</strong>
                    <span 
                      className="band-score"
                      style={{color: getBandColor(result.detailedScores.coherenceCohesion)}}
                    >
                      Band {result.detailedScores.coherenceCohesion}
                    </span>
                  </div>
                  {result.bandDescriptions && (
                    <div className="criteria-description">
                      {result.bandDescriptions.coherenceCohesion}
                    </div>
                  )}
                </div>
                
                <div className="criteria-item-ielts">
                  <div className="criteria-header">
                    <strong>Lexical Resource</strong>
                    <span 
                      className="band-score"
                      style={{color: getBandColor(result.detailedScores.lexicalResource)}}
                    >
                      Band {result.detailedScores.lexicalResource}
                    </span>
                  </div>
                  {result.bandDescriptions && (
                    <div className="criteria-description">
                      {result.bandDescriptions.lexicalResource}
                    </div>
                  )}
                </div>
                
                <div className="criteria-item-ielts">
                  <div className="criteria-header">
                    <strong>Grammatical Range & Accuracy</strong>
                    <span 
                      className="band-score"
                      style={{color: getBandColor(result.detailedScores.grammaticalAccuracy)}}
                    >
                      Band {result.detailedScores.grammaticalAccuracy}
                    </span>
                  </div>
                  {result.bandDescriptions && (
                    <div className="criteria-description">
                      {result.bandDescriptions.grammaticalAccuracy}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Retroalimentación específica IELTS */}
            <div className="details-section">
              <div className="detail-item">
                <strong>📊 Evaluación General:</strong>
                <div className="feedback" dangerouslySetInnerHTML={{__html: result.feedback.general.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
              </div>
              
              <div className="detail-item">
                <strong>📝 Palabras escritas:</strong> {result.wordCount}
                {result.wordCount < 250 && (
                  <span style={{color: '#EF4444', marginLeft: '10px'}}>
                    ⚠️ Penalización: -1 banda por menos de 250 palabras
                  </span>
                )}
              </div>

              {/* Feedback por criterios (nuevo formato) */}
              {result.feedback.criteriaFeedback && (
                <div className="detail-item">
                  <strong>🔍 Análisis por Criterios:</strong>
                  <div className="criteria-feedback">
                    {Object.entries(result.feedback.criteriaFeedback).map(([criterion, feedback]) => (
                      <div key={criterion} className="criterion-feedback">
                        <div 
                          className="criterion-name"
                          style={{
                            fontWeight: 'bold',
                            color: '#2563EB',
                            marginBottom: '5px',
                            textTransform: 'capitalize'
                          }}
                        >
                          {criterion.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </div>
                        <div 
                          className="criterion-text"
                          dangerouslySetInnerHTML={{
                            __html: feedback.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendaciones clave */}
              {result.feedback.keyRecommendations && result.feedback.keyRecommendations.length > 0 && (
                <div className="detail-item">
                  <strong>🎯 Recomendaciones Prioritarias:</strong>
                  <ul>
                    {result.feedback.keyRecommendations.map((rec, index) => (
                      <li 
                        key={index}
                        dangerouslySetInnerHTML={{
                          __html: rec.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {/* Próximos pasos */}
              {result.feedback.nextSteps && result.feedback.nextSteps.length > 0 && (
                <div className="detail-item">
                  <strong>🚀 Próximos Pasos:</strong>
                  <ul>
                    {result.feedback.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Análisis del tema */}
              {result.topicAnalysis && (
                <div className="topic-analysis">
                  <h3>🔍 Análisis de Relevancia al Tema:</h3>
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <strong>Enfoque del Tema:</strong> 
                      <span style={{
                        color: result.topicAnalysis.topicFocus === 'High' ? '#10B981' : 
                               result.topicAnalysis.topicFocus === 'Medium' ? '#F59E0B' : '#EF4444'
                      }}>
                        {result.topicAnalysis.topicFocus}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <strong>Palabras Clave Usadas:</strong> {result.topicAnalysis.keywordRatio}%
                    </div>
                    <div className="analysis-item">
                      <strong>Conceptos Cubiertos:</strong> {result.topicAnalysis.conceptRatio}%
                    </div>
                  </div>
                </div>
              )}

              {/* Compatibilidad con formato anterior */}
              {result.feedback.strengths && result.feedback.strengths.length > 0 && (
                <div className="detail-item">
                  <strong>✅ Fortalezas:</strong>
                  <ul>
                    {result.feedback.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.feedback.improvements && result.feedback.improvements.length > 0 && (
                <div className="detail-item">
                  <strong>📈 Áreas de Mejora:</strong>
                  <ul>
                    {result.feedback.improvements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="actions">
              <button className="retry-button" onClick={resetTest}>
                🔄 Nueva Evaluación IELTS
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
