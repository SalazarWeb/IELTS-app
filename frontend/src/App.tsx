import React, { useState, useEffect } from 'react';
import './App.css';

// Tipos TypeScript
interface EvaluationResult {
  score: number;
  status: string;
  feedback: string;
  wordCount: number;
}

interface Topic {
  topic: string;
}

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'writing' | 'results'>('welcome');
  const [topic, setTopic] = useState<string>('');
  const [essay, setEssay] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60); // 20 minutos en segundos
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      const response = await fetch('http://localhost:5000/api/get-topic');
      const data: Topic = await response.json();
      setTopic(data.topic);
    } catch (error) {
      console.error('Error al obtener el tema:', error);
      setTopic('Error al cargar el tema. Por favor, recarga la página.');
    }
  };

  // Evaluar ensayo
  const evaluateEssay = async () => {
    if (wordCount < 150) {
      alert('El ensayo debe tener al menos 150 palabras.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ essay }),
      });
      
      const data: EvaluationResult = await response.json();
      setResult(data);
      setCurrentScreen('results');
      setIsTimerActive(false);
    } catch (error) {
      console.error('Error al evaluar el ensayo:', error);
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
    setTimeLeft(20 * 60);
    setEssay('');
  };

  // Reiniciar prueba
  const resetTest = () => {
    setCurrentScreen('welcome');
    setTopic('');
    setEssay('');
    setTimeLeft(20 * 60);
    setIsTimerActive(false);
    setResult(null);
  };

  // Pantalla de bienvenida
  if (currentScreen === 'welcome') {
    return (
      <div className="app">
        <div className="welcome-screen">
          <div className="welcome-card">
            <h1>🎓 Evaluador de Ensayos IELTS</h1>
            <div className="instructions">
              <h2>Instrucciones</h2>
              <ul>
                <li>✏️ Tendrás <strong>20 minutos</strong> para escribir tu ensayo</li>
                <li>📝 Mínimo <strong>150 palabras</strong> requeridas</li>
                <li>🎯 Serás evaluado del <strong>en base a 5</strong></li>
                <li>✅ Necesitas <strong>3 o más</strong> para aprobar</li>
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
              <span className={`word-count ${wordCount < 150 ? 'insufficient' : 'sufficient'}`}>
                📊 {wordCount} palabras
              </span>
            </div>
          </div>
          
          <div className="topic-section">
            <h2>📋 Tema del ensayo:</h2>
            <p className="topic-text">{topic}</p>
          </div>

          <div className="essay-section">
            <textarea
              className="essay-textarea"
              placeholder="Escribe tu ensayo aquí..."
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              disabled={timeLeft === 0}
            />
          </div>

          <div className="actions">
            <button 
              className="evaluate-button"
              onClick={evaluateEssay}
              disabled={wordCount < 150 || isLoading}
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
    return (
      <div className="app">
        <div className="results-screen">
          <div className="results-card">
            <h1>📊 Resultados de tu Ensayo</h1>
            
            <div className="score-section">
              <div className={`score-display ${result.status === 'Aprobado' ? 'passed' : 'failed'}`}>
                <span className="score-number">{result.score}</span>
                <span className="score-total">/5</span>
              </div>
              <div className={`status ${result.status === 'Aprobado' ? 'passed' : 'failed'}`}>
                {result.status === 'Aprobado' ? '🎉' : '❌'} {result.status}
              </div>
            </div>

            <div className="details-section">
              <div className="detail-item">
                <strong>📝 Palabras escritas:</strong> {result.wordCount}
              </div>
              <div className="detail-item">
                <strong>💬 Retroalimentación:</strong>
                <p className="feedback">{result.feedback}</p>
              </div>
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

  return null;
};

export default App;
