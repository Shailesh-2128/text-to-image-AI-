const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!process.env.HF_API_KEY || process.env.HF_API_KEY === 'your_huggingface_api_key') {
    return res.status(500).json({ error: 'Hugging Face API key is not configured.' });
  }

  try {
    const response = await axios.post(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'image/jpeg'
        },
        responseType: 'arraybuffer' // Necessary to handle binary image data properly
      }
    );

    // Convert binary data to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');

    // Send data URI
    res.status(200).json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error) {
    let errorMsg = error.message;
    if (error.response && error.response.data) {
      try {
        const parsed = JSON.parse(Buffer.from(error.response.data).toString());
        errorMsg = parsed.error || JSON.stringify(parsed);
      } catch (e) {
        errorMsg = Buffer.from(error.response.data).toString();
      }
    }
    console.error('Error generating image:', errorMsg);

    res.status(500).json({
      error: `Failed: ${errorMsg}`
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
