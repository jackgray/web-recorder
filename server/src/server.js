require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { transcribeAudio } = require('./whisper');

const app = express();
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const CLIENT_ENDPOINT = process.env.CLIENT_ENDPOINT || `http://localhost:${CLIENT_PORT}`;

// Middlewares
app.use(
  cors({
    origin: CLIENT_ENDPOINT,
    credentials: true,
  })
);
app.use(express.json());
app.use('/config', express.static('/app/data/config'));
app.use('/audio', express.static('/app/data/audio'));
app.use('/uploads', express.static('/app/data/uploads'));
app.juse('/transcripts', express.static('/app/data/transcripts'));

// Serving JSON files
app.get('/config/:filename', (req, res) => {
  const options = {
    root: '/app/data/config',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true,
      'Content-Type': 'application/json',
    },
  };

  const fileName = req.params.filename;
  res.sendFile(fileName, options, (err) => {
    if (err) {
      console.error('Error sending the file:', err);
      res.status(err.status).end();
    }
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/app/data/audio');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }).single('audio');

app.post('/uploads', upload, async (req, res) => {
  try {
    console.log('Checking req:', req);
    console.log('Checking req.file:', req.file);
    const audioFile = req.file;

    // Get the original file name, remove the extension, and add .mp3
    const filename = path.parse(audioFile.originalname).name;
    console.log('Filename:', filename);
    const tempFilePath = audioFile.path;
    const mp3OutputPath = `/app/data/audio/${filename}.mp3`;
    const transcriptPath = `/app/data/transcripts/${filename}.json`;

    // Convert the WebM file to MP3
    ffmpeg(tempFilePath)
      .outputOptions('-c:a libmp3lame')
      .toFormat('mp3')
      .save(mp3OutputPath)
      .on('end', async () => {
        // Send the MP3 file to the client
        res.set('Content-Type', 'audio/mpeg');
        res.download(mp3OutputPath, `${filename}.mp3`);
      })
      .on('error', (err) => {
        console.error('Error converting the audio file:', err);
        res.status(500).send({ error: 'Error converting the audio file' });
      });

    // Call Whisper integration asynchronously
    const transcript = await transcribeAudio(mp3OutputPath);

    // Save the transcript to a file
    fs.writeFileSync(transcriptPath, JSON.stringify(transcript));

    // Send the transcript URL to the client
    res.set('Content-Type', 'application/json');
    res.download(transcriptPath, `${filename}.json`);
  } catch (err) {
    console.error('Error processing the audio file: ', err);
    res.status(500).send({ error: 'Error processing the audio file' });
  }
});



app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
  console.log(`CORS enabled: allowing requests only from ${CLIENT_ENDPOINT}`);
});
