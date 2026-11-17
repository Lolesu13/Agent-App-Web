const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { OpenAI } = require('openai');

const app = express();
app.use(express.json());
app.use(cors());

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('Advertencia: OPENROUTER_API_KEY no está definida en .env');
}

// Inicializar el cliente de OpenAI apuntando a la baseURL de OpenRouter
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Mi Aplicativo Web',
  },
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El campo "message" es obligatorio.' });
    }

    // Construir el arreglo de mensajes combinando historial y mensaje actual
    const safeHistory = Array.isArray(history) ? history : [];
    const messages = [...safeHistory, { role: 'user', content: message }];

    // Llamada a la API a través de OpenRouter usando el modelo con reasoning habilitado
    const completion = await openrouter.chat.completions.create({
      model: 'baidu/ernie-5.5-flash-preview:free',
      messages,
      reasoning: { enabled: true },
    });

    const assistantMessage = completion.choices?.[0]?.message;
    const reply = assistantMessage?.content ?? '';

    res.json({
      reply,
      reasoning_details: assistantMessage?.reasoning_details,
    });
  } catch (error) {
    console.error('Error al comunicarse con OpenRouter:', error);
    res.status(500).json({ error: 'Error interno al procesar la solicitud con la IA' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
