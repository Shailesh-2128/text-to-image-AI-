const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const Image = require('../models/Image');
const Chat = require('../models/Chat');

router.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // optional auth
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const jwt = require('jsonwebtoken');
  let userId = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      userId = decoded.userId;
    } catch(e) {}
  }

  if (!process.env.HF_API_KEY || process.env.HF_API_KEY === 'your_huggingface_api_key') {
    return res.status(500).json({ error: 'Hugging Face API key is not configured.' });
  }

  try {
    const { InferenceClient } = require("@huggingface/inference");
    const client = new InferenceClient(process.env.HF_API_KEY);

    const imageBlob = await client.textToImage({
      provider: "fal-ai",
      model: "baidu/ERNIE-Image",
      inputs: prompt,
      parameters: { num_inference_steps: 5 },
    });

    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    // If logged in, save to chat history and update counts
    if (userId) {
      const chat = new Chat({ userId, prompt, imageUrl });
      await chat.save();
    }

    res.status(200).json({ image: imageUrl });
  } catch (error) {
    console.error('Hugging Face image generation error:', error);
    const message = error.message || 'Failed to generate image';
    res.status(500).json({ error: `Failed: ${message}` });
  }
});

router.post('/save-image', auth, async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    const image = new Image({ userId: req.userId, imageUrl, prompt });
    await image.save();
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/saved-images', auth, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/chat-history', auth, async (req, res) => {
  try {
    const history = await Chat.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
