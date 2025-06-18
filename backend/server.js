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

// Lista de temas IELTS Task 2 con análisis de palabras clave
const ieltsTopics = [
  {
    id: 0,
    text: "Some people believe that technology has made our lives more complex, while others think it has made our lives easier. To what extent do you agree or disagree with this statement?",
    type: "agree_disagree",
    keywords: ["technology", "complex", "complicated", "easier", "simple", "digital", "devices", "smartphone", "computer", "internet", "automation", "convenience", "efficiency"],
    concepts: ["modern life", "technological advancement", "complexity vs simplicity", "daily tasks", "communication", "work life"]
  },
  {
    id: 1,
    text: "Many people think that universities should only offer practical subjects that prepare students for employment. To what extent do you agree or disagree?",
    type: "agree_disagree",
    keywords: ["universities", "practical", "subjects", "employment", "job", "career", "skills", "theoretical", "academic", "education", "vocational", "training"],
    concepts: ["higher education", "career preparation", "theoretical vs practical knowledge", "job market", "university curriculum"]
  },
  {
    id: 2,
    text: "Some experts believe that children should learn a foreign language from primary school rather than secondary school. Do the advantages of this outweigh the disadvantages?",
    type: "advantages_disadvantages",
    keywords: ["children", "foreign language", "primary school", "secondary school", "early age", "learning", "bilingual", "education", "advantages", "disadvantages"],
    concepts: ["language acquisition", "early childhood education", "cognitive development", "educational timing", "multilingualism"]
  },
  {
    id: 3,
    text: "In many countries, the number of elderly people is increasing rapidly. What problems might this cause and what solutions can you suggest?",
    type: "problem_solution",
    keywords: ["elderly", "aging", "population", "problems", "solutions", "healthcare", "pension", "retirement", "care", "society", "demographic"],
    concepts: ["aging population", "demographic change", "healthcare system", "social services", "economic impact", "intergenerational support"]
  },
  {
    id: 4,
    text: "Some people argue that governments should spend more money on public transportation than on roads for private vehicles. To what extent do you agree or disagree?",
    type: "agree_disagree",
    keywords: ["government", "spending", "public transportation", "roads", "private vehicles", "cars", "buses", "trains", "infrastructure", "traffic", "environment"],
    concepts: ["public vs private transport", "government investment", "urban planning", "environmental impact", "traffic congestion"]
  },
  {
    id: 5,
    text: "Many believe that social media has a negative impact on young people's mental health. Do you agree or disagree with this statement?",
    type: "agree_disagree",
    keywords: ["social media", "negative impact", "young people", "mental health", "depression", "anxiety", "facebook", "instagram", "twitter", "online", "psychological"],
    concepts: ["digital wellness", "youth psychology", "online behavior", "mental health issues", "social comparison", "cyberbullying"]
  },
  {
    id: 6,
    text: "Some people think that homework is an important part of children's education, while others believe it is unnecessary. Discuss both views and give your opinion.",
    type: "discuss_both_views",
    keywords: ["homework", "children", "education", "important", "unnecessary", "learning", "school", "academic", "practice", "stress", "family time"],
    concepts: ["educational methods", "child development", "work-life balance", "academic achievement", "parental involvement"]
  },
  {
    id: 7,
    text: "In some countries, online shopping is replacing shopping in stores. Do you think this is a positive or negative development?",
    type: "positive_negative",
    keywords: ["online shopping", "e-commerce", "stores", "retail", "internet", "positive", "negative", "development", "convenience", "local business"],
    concepts: ["digital commerce", "retail industry", "consumer behavior", "economic impact", "technological change"]
  },
  {
    id: 8,
    text: "Some people believe that climate change is the most important issue facing humanity today. To what extent do you agree or disagree?",
    type: "agree_disagree",
    keywords: ["climate change", "global warming", "environment", "humanity", "important", "issue", "carbon", "pollution", "sustainability", "future generations"],
    concepts: ["environmental crisis", "global challenges", "sustainability", "environmental protection", "future of humanity"]
  },
  {
    id: 9,
    text: "Many argue that traditional newspapers will disappear in the future as people increasingly get their news online. Do you agree or disagree?",
    type: "agree_disagree",
    keywords: ["newspapers", "traditional", "disappear", "future", "online", "news", "digital", "media", "internet", "journalism", "information"],
    concepts: ["media evolution", "digital transformation", "information consumption", "journalism industry", "technological disruption"]
  }
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
    const topicData = ieltsTopics[randomIndex];
    
    res.json({ 
      topic: topicData.text, // Mantenemos compatibilidad con frontend
      topicId: randomIndex,
      topicData: topicData, // Enviamos datos completos para evaluación
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
    const { essay, topic, topicData } = req.body; // Agregamos topicData
    
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

    // Evaluar ensayo CON datos del tema para análisis de relevancia
    const evaluation = ieltsEvaluator.evaluateEssay(essay, topic, topicData);

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