const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
  "Many argue that traditional newspapers will disappear in the future as people increasingly get their news online. Do you agree or disagree?"
];

// Función para contar palabras
const countWords = (text) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Función simulada de evaluación (será reemplazada por el modelo de IA)
const evaluateEssay = (essay) => {
  const wordCount = countWords(essay);
  
  // Verificar longitud mínima
  if (wordCount < 150) {
    return {
      score: 0,
      status: "Desaprobado",
      feedback: "El ensayo debe tener al menos 150 palabras.",
      wordCount
    };
  }

  // Evaluación simulada basada en criterios básicos
  let score = 3; // Puntuación base

  // Criterios de evaluación simulados
  const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / sentences.length;
  
  // Bonificaciones y penalizaciones
  if (wordCount > 250) score += 0.5; // Ensayo más extenso
  if (avgWordsPerSentence > 15) score += 0.3; // Oraciones más complejas
  if (essay.includes('however') || essay.includes('furthermore') || essay.includes('therefore')) {
    score += 0.4; // Uso de conectores
  }
  if (essay.toLowerCase().includes('in conclusion') || essay.toLowerCase().includes('to conclude')) {
    score += 0.3; // Conclusión clara
  }

  // Limitar puntuación entre 0 y 5
  score = Math.min(5, Math.max(0, score));
  score = Math.round(score * 2) / 2; // Redondear a medios puntos

  const status = score >= 3 ? "Aprobado" : "Desaprobado";
  
  let feedback = "";
  if (score < 3) {
    feedback = "El ensayo necesita mejorar en estructura, vocabulario y desarrollo de ideas.";
  } else if (score >= 3 && score < 4) {
    feedback = "Buen ensayo con ideas claras. Considera usar más vocabulario variado y conectores.";
  } else {
    feedback = "Excelente ensayo con buena estructura, vocabulario apropiado y desarrollo coherente de ideas.";
  }

  return {
    score,
    status,
    feedback,
    wordCount
  };
};

// Endpoints
app.get('/api/get-topic', (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * ieltsTopics.length);
    const topic = ieltsTopics[randomIndex];
    res.json({ topic });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el tema' });
  }
});

app.post('/api/evaluate', (req, res) => {
  try {
    const { essay } = req.body;
    
    if (!essay || typeof essay !== 'string') {
      return res.status(400).json({ error: 'El ensayo es requerido' });
    }

    const result = evaluateEssay(essay);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al evaluar el ensayo' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});