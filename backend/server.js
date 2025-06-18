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
    text: "Should schools replace human teachers with AI tutors? Discuss advantages, risks, and your stance.",
    type: "discuss_both_views",
    keywords: ["schools", "replace", "human teachers", "AI tutors", "artificial intelligence", "advantages", "risks", "education", "technology", "learning", "automation", "teaching"],
    concepts: ["AI in education", "human vs artificial teaching", "educational technology", "teacher replacement", "learning outcomes", "digital transformation"]
  },
  {
    id: 1,
    text: "Tourism damages local cultures and environments. To what extent do you agree? Propose solutions.",
    type: "agree_disagree",
    keywords: ["tourism", "damages", "local cultures", "environments", "sustainable", "solutions", "impact", "conservation", "heritage", "community", "ecology", "preservation"],
    concepts: ["sustainable tourism", "cultural preservation", "environmental impact", "local communities", "tourism management", "heritage protection"]
  },
  {
    id: 2,
    text: "Analyze how Instagram and TikTok impact teenagers' self-esteem. Include personal examples.",
    type: "problem_solution",
    keywords: ["Instagram", "TikTok", "teenagers", "self-esteem", "social media", "impact", "mental health", "comparison", "influence", "youth", "psychology", "confidence"],
    concepts: ["social media psychology", "teenage development", "digital influence", "self-image", "online behavior", "mental health"]
  },
  {
    id: 3,
    text: "Is remote work beneficial for work-life balance or does it isolate people? Support your view.",
    type: "discuss_both_views",
    keywords: ["remote work", "work-life balance", "isolate", "beneficial", "telecommuting", "home office", "productivity", "social interaction", "flexibility", "isolation"],
    concepts: ["work flexibility", "social isolation", "work-life integration", "remote collaboration", "digital workplace", "employee wellbeing"]
  },
  {
    id: 4,
    text: "Genetically modified crops: A solution for world hunger or an environmental threat?",
    type: "discuss_both_views",
    keywords: ["genetically modified", "GMO", "crops", "world hunger", "environmental threat", "biotechnology", "agriculture", "food security", "genetic engineering", "sustainability"],
    concepts: ["agricultural biotechnology", "food security", "environmental impact", "genetic modification", "sustainable farming", "global nutrition"]
  },
  {
    id: 5,
    text: "Space exploration wastes resources that should solve Earth's problems. Debate this claim.",
    type: "agree_disagree",
    keywords: ["space exploration", "wastes resources", "Earth's problems", "NASA", "space program", "funding", "priorities", "research", "technology", "innovation", "investment"],
    concepts: ["space investment", "resource allocation", "scientific priorities", "technological advancement", "global challenges", "space benefits"]
  },
  {
    id: 6,
    text: "Can NFT art be considered as valuable as classical paintings? Compare cultural impacts.",
    type: "discuss_both_views",
    keywords: ["NFT art", "classical paintings", "valuable", "cultural impacts", "digital art", "blockchain", "traditional art", "creativity", "market value", "artistic expression"],
    concepts: ["digital vs traditional art", "artistic value", "cultural significance", "art market evolution", "creative expression", "technological art"]
  },
  {
    id: 7,
    text: "Should governments invest in nuclear power instead of solar/wind energy? Weigh risks and benefits.",
    type: "discuss_both_views",
    keywords: ["governments", "nuclear power", "solar energy", "wind energy", "renewable", "investment", "risks", "benefits", "clean energy", "climate change", "sustainability"],
    concepts: ["energy policy", "renewable energy", "nuclear safety", "climate solutions", "energy sustainability", "environmental protection"]
  },
  {
    id: 8,
    text: "Esports require the same skill as physical sports and deserve Olympic recognition. Argue for/against.",
    type: "agree_disagree",
    keywords: ["esports", "skill", "physical sports", "Olympic recognition", "gaming", "competition", "athletes", "training", "professional", "sports industry"],
    concepts: ["competitive gaming", "sports definition", "Olympic standards", "professional gaming", "skill comparison", "sports evolution"]
  },
  {
    id: 9,
    text: "Would $1,000 monthly for all citizens reduce poverty or discourage work? Use real-case evidence.",
    type: "discuss_both_views",
    keywords: ["universal basic income", "UBI", "1000 monthly", "citizens", "poverty", "discourage work", "welfare", "social policy", "economics", "employment", "social security"],
    concepts: ["universal basic income", "poverty reduction", "work incentives", "social welfare", "economic policy", "income inequality"]
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
        message: 'Por favor escribe al menos 250 palabras para una evaluación adecuada'
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