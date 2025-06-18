const express = require('express');
const cors = require('cors');
const EssayAnalyzer = require('./services/essayAnalyzer');
const IELTSEvaluator = require('./services/ieltsEvaluator');

const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar servicios (solo los necesarios)
const essayAnalyzer = new EssayAnalyzer();
const ieltsEvaluator = new IELTSEvaluator();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lista de temas IELTS Task 2
const ieltsTopics = [
  "Some people believe that technology has made our lives more complex, while others think it has made our lives easier. To what extent do you agree or disagree with this statement?",
  "Many people think that universities should only offer practical subjects that prepare students for employment. To what extent do you agree or disagree?",
  "Some experts believe that children should learn a foreign language from primary school rather than secondary school. Do the advantages of this outweigh the disadvantages?",
  "In many countries, the number of elderly people is increasing rapidly. What problems might this cause and what solutions can you suggest?",
  "Some people argue that governments should spend more money on public transportation than on roads for private vehicles. To what extent do you agree or disagree?",
  "Many believe that social media has a negative impact on young people's mental health. Do you agree or disagree with this statement?",
  "Some people think that homework is an important part of children's education, while others believe it is unnecessary. Discuss both views and give your opinion.",
  "In some countries, online shopping is replacing shopping in stores. Do you think this is a positive or negative development?",
  "Some people believe that climate change is the most important issue facing humanity today. To what extent do you agree or disagree?",
  "Many argue that traditional newspapers will disappear in the future as people increasingly get their news online. Do you agree or disagree?",
  "Some people think that famous people are treated unfairly by the media, and they should be given more privacy. To what extent do you agree or disagree?",
  "In many countries, people are living longer than ever before. Some people say an ageing population creates problems for governments. Other people think there are benefits if society has more elderly people. To what extent do the advantages of having an ageing population outweigh the disadvantages?",
  "Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both these views and give your own opinion.",
  "In the future, nobody will buy printed newspapers or books because they will be able to read everything they want online without paying. To what extent do you agree or disagree with this statement?",
  "Some people say that the main environmental problem of our time is the loss of particular species of plants and animals. Others say that there are more important environmental problems. Discuss both these views and give your own opinion."
];

// Recursos y consejos IELTS
const ieltsResources = {
  writingTips: [
    {
      category: "Estructura",
      tips: [
        "Introducción: Parafrasea la pregunta y presenta tu tesis (50-60 palabras)",
        "Párrafo principal 1: Presenta tu primer argumento con ejemplos (80-100 palabras)",
        "Párrafo principal 2: Presenta tu segundo argumento con ejemplos (80-100 palabras)",
        "Conclusión: Resume tus puntos principales y reafirma tu posición (40-50 palabras)"
      ]
    },
    {
      category: "Vocabulario",
      tips: [
        "Usa conectores académicos: however, furthermore, consequently, nevertheless",
        "Evita repetición: utiliza sinónimos y pronombres de referencia",
        "Incluye vocabulario formal: significant, substantial, demonstrate, facilitate",
        "Evita vocabulario muy básico: very, really, big, small, good, bad"
      ]
    },
    {
      category: "Gramática",
      tips: [
        "Varía la longitud de las oraciones para mayor fluidez",
        "Usa estructuras complejas: condicionales, voz pasiva, cláusulas relativas",
        "Incluye verbos modales: should, would, could, might, may",
        "Practica diferentes tipos de oraciones: simples, compuestas, complejas"
      ]
    },
    {
      category: "Tiempo",
      tips: [
        "Planificación: 5 minutos para estructurar ideas",
        "Escritura: 30 minutos para desarrollar el ensayo",
        "Revisión: 5 minutos para corregir errores",
        "Objetivo: 280-320 palabras para desarrollo completo"
      ]
    }
  ],
  commonMistakes: [
    "No responder todas las partes de la pregunta",
    "Falta de ejemplos específicos para apoyar argumentos",
    "Uso repetitivo del mismo vocabulario",
    "Párrafos desbalanceados en longitud",
    "Falta de conectores entre ideas",
    "Conclusión que introduce nuevas ideas"
  ],
  bandDescriptors: {
    "5.0": "Excelente: Respuesta completa, coherente, vocabulario flexible, gramática precisa",
    "4.0": "Competente: Buena respuesta, organizada, vocabulario adecuado, gramática controlada",
    "3.0": "Moderado: Respuesta básica, algunas ideas desarrolladas, vocabulario limitado",
    "2.0": "Limitado: Respuesta parcial, ideas poco desarrolladas, errores frecuentes",
    "1.0": "Extremadamente limitado: Respuesta inadecuada, errores severos"
  }
};

// ==================== ENDPOINTS PRINCIPALES ====================

// Obtener tema aleatorio
app.get('/api/topic', (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * ieltsTopics.length);
    const topic = ieltsTopics[randomIndex];
    
    res.json({ 
      topic,
      topicId: randomIndex,
      guidelines: {
        timeLimit: "40 minutos",
        minWords: 250,
        recommendedWords: "280-320",
        taskType: "IELTS Task 2"
      }
    });
  } catch (error) {
    console.error('Error al obtener tema:', error);
    res.status(500).json({ error: 'Error al obtener el tema' });
  }
});

// Evaluar ensayo (SIN guardar datos)
app.post('/api/evaluate', (req, res) => {
  try {
    const { essay, topic } = req.body;
    
    if (!essay || typeof essay !== 'string') {
      return res.status(400).json({ error: 'El ensayo es requerido' });
    }

    // Verificar longitud mínima
    const wordCount = essay.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 50) {
      return res.status(400).json({ 
        error: 'El ensayo es demasiado corto',
        message: 'Por favor escribe al menos 150 palabras para una evaluación adecuada'
      });
    }

    // Evaluar ensayo (SIN userId - no guarda nada)
    const evaluation = ieltsEvaluator.evaluateEssay(essay, topic);

    res.json({
      ...evaluation,
      analysisTimestamp: new Date().toISOString(),
      nextSteps: getNextSteps(evaluation.score)
    });
    
  } catch (error) {
    console.error('Error al evaluar ensayo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener consejos y recursos generales
app.get('/api/resources', (req, res) => {
  try {
    const { category } = req.query;
    
    if (category) {
      const categoryData = ieltsResources.writingTips.find(tip => 
        tip.category.toLowerCase() === category.toLowerCase()
      );
      
      if (!categoryData) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      
      res.json(categoryData);
    } else {
      res.json(ieltsResources);
    }
  } catch (error) {
    console.error('Error al obtener recursos:', error);
    res.status(500).json({ error: 'Error al obtener recursos' });
  }
});

// Análisis detallado de ensayo (solo análisis, sin evaluación)
app.post('/api/analyze', (req, res) => {
  try {
    const { essay, topic } = req.body;
    
    if (!essay) {
      return res.status(400).json({ error: 'El ensayo es requerido' });
    }

    const analysis = essayAnalyzer.analyzeEssay(essay, topic);
    
    res.json({
      analysis,
      timestamp: new Date().toISOString(),
      summary: generateAnalysisSummary(analysis)
    });
  } catch (error) {
    console.error('Error al analizar ensayo:', error);
    res.status(500).json({ error: 'Error al analizar ensayo' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor IELTS funcionando correctamente',
    timestamp: new Date().toISOString(),
    services: {
      essayAnalyzer: 'Active',
      ieltsEvaluator: 'Active'
    }
  });
});

// ==================== FUNCIONES AUXILIARES ====================

function getNextSteps(score) {
  if (score >= 4.5) {
    return [
      "¡Excelente trabajo! Mantén este nivel practicando regularmente",
      "Enfócate en pulir detalles menores",
      "Considera tomar el examen oficial"
    ];
  } else if (score >= 4.0) {
    return [
      "Muy buen nivel. Practica con temas más desafiantes",
      "Refina el vocabulario académico avanzado",
      "Perfecciona las estructuras más complejas"
    ];
  } else if (score >= 3.0) {
    return [
      "Buen progreso. Continúa practicando regularmente",
      "Enfócate en desarrollar ideas con más detalle",
      "Practica diferentes tipos de ensayos"
    ];
  } else {
    return [
      "Sigue practicando. El progreso lleva tiempo",
      "Enfócate en los fundamentos básicos",
      "Considera estudiar gramática y vocabulario básico"
    ];
  }
}

function generateAnalysisSummary(analysis) {
  return {
    strengths: [
      analysis.wordAnalysis.lexicalDiversity > 0.5 ? "Buena diversidad léxica" : null,
      analysis.vocabularyAnalysis.academicConnectors >= 2 ? "Uso efectivo de conectores" : null,
      analysis.structureAnalysis.hasIntroduction && analysis.structureAnalysis.hasConclusion ? "Estructura clara" : null
    ].filter(Boolean),
    improvements: [
      analysis.wordAnalysis.totalWords < 250 ? "Aumentar longitud del ensayo" : null,
      analysis.vocabularyAnalysis.weakVocabulary >= 3 ? "Mejorar vocabulario académico" : null,
      analysis.coherenceAnalysis.transitionVariety === 'Limited variety' ? "Variar conectores" : null
    ].filter(Boolean)
  };
}

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: 'Por favor intenta nuevamente más tarde'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor IELTS simplificado corriendo en puerto ${PORT}`);
  console.log(`📊 Servicios cargados: EssayAnalyzer, IELTSEvaluator`);
  console.log(`🎯 API disponible en: http://localhost:${PORT}/api/`);
});