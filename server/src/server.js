require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const https = require("https");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const FormData = require('form-data');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
ffmpeg.setFfmpegPath(ffmpegPath);
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const WHISPER_PORT = process.env.WHISPER_PORT || 9000;
const CLIENT_ENDPOINT =
  process.env.CLIENT_ENDPOINT || `http://localhost:${CLIENT_PORT}`;
const WHISPER_ENDPOINT =
  process.env.WHISPER_ENDPOINT || `http://localhost:${WHISPER_PORT}`;

let options = {};
try {
  options = {
    key: fs.readFileSync("/app/data/ssl/server_ssl.key"),
    cert: fs.readFileSync("/app/data/ssl/server_ssl.crt"),
    ca: fs.readFileSync("/app/data/ssl/server_ssl.ca-bundle"),
    dhparam: fs.readFileSync("/app/data/ssl/dhparam.pem"),
    secureProtocol: "TLSv1_2_method",
    ciphers: [
      "ECDHE-RSA-AES128-GCM-SHA256",
      "ECDHE-ECDSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "ECDHE-ECDSA-AES256-GCM-SHA384",
      "DHE-RSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES128-SHA256",
      "DHE-RSA-AES128-SHA256",
      "ECDHE-RSA-AES256-SHA384",
      "DHE-RSA-AES256-SHA384",
    ].join(":"),
    honorCipherOrder: true,
  };
} catch (e) {
  console.error("Error reading SSL certificate:", e);
}

// Middlewares
app.use(
  cors({
    origin: CLIENT_ENDPOINT,
    credentials: true,
  })
);

app.use(express.json());
app.use("/config", express.static("/app/data/config"));
app.use("/audio", express.static("/app/data/audio"));
app.use("/uploads", express.static("/app/data/uploads"));

// Serving JSON files
app.get("/config/:filename", (req, res) => {
  const options = {
    root: "/app/data/config",
    dotfiles: "deny",
    headers: {
      "x-timestamp": Date.now(),
      "x-sent": true,
      "Content-Type": "application/json",
    },
  };

  const fileName = req.params.filename;
  res.sendFile(fileName, options, (err) => {
    if (err) {
      console.error("Error sending the file:", err);
      res.status(err.status).end();
    }
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/app/data/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname}.ogg`);
  },
});

const upload = multer({ storage: storage }).single("audio");

app.post("/uploads", upload, async (req, res) => {
  try {
    console.log("Checking req: ", req);
    console.log("Checking req.file: ", req.file);
    const audioFile = req.file;

    // Get the original file name, remove the extension, and add .mp3
    const filename = path.parse(audioFile.originalname).name;
    console.log("Filename: ", filename);
    const tempFilePath = audioFile.path;
    const mp3OutputPath = `/app/data/audio/${filename}.mp3`;
    const mp3DownloadUrl = `/audio/${filename}.mp3`;
    const transcriptPath = `/app/data/transcripts/${filename}.json`;
    const transcriptDownloadUrl = `/transcripts/${filename}.json`;

    await convertToMP3(tempFilePath, mp3OutputPath);
    const whisperRes = await callWhisperAPI(mp3OutputPath);

    if (whisperRes.status === 200) {
      fs.writeFileSync(transcriptPath, JSON.stringify(whisperRes.data));
      res.json({ url: `/audio/${filename}.mp3`, filename: `${filename}.mp3`, transcriptUrl: `/transcripts/${filename}.json`, transcriptFilename: `${filename}.json` });  
    } else {
      console.error("Error calling the Whisper API: ", error, whisperRes.status);
      return res.status(500).send({ error: "Whisper integration error" });
    }
  } catch (error) {
    console.log(
      "Error getting webm file from client or converting to MP3:",
      error
    );
    return res.status(500).send({ error: "File conversion error" });
  }
});

async function convertToMP3(tempFilePath, mp3OutputPath) {
  return new Promise((resolve, reject) => {
  ffmpeg(tempFilePath)
    .outputOptions("-c:a libmp3lame")
    .toFormat("mp3")
    .save(mp3OutputPath)
    .on("error", (err) => {
      console.error("Error converting file to MP3: ", err);
      reject(err);
    })
    .on("end", () => {
      fs.unlinkSync(tempFilePath);
      resolve();
    });
  });
}

async function callWhisperAPI(mp3OutputPath) {
  const audioStream = fs.createReadStream(mp3OutputPath);
  const audioForm = new FormData();
  audioForm.append('audio', audioStream, {
    file_name: path.basename(mp3OutputPath),
    type: 'audio/mpeg',
  });

  return axios.post(WHISPER_ENDPOINT, audioForm, {
    params: {
      task: 'transcribe',
      language: 'en',
      output: 'json',
    },
    headers: {
      ...audioForm.getHeaders(),
      'Content-Type': 'multipart/form-data'
    },
  });
}

let server;
try {
  server = https.createServer(options, app);
} catch (e) {
  console.error("Error creating HTTPS server:", e);
  // If HTTPS server creation fails, fallback to HTTP
  console.log("Using HTTP instead.");
  server = express();
}

server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
  console.log(`CORS enabled: allowing requests only from ${CLIENT_ENDPOINT}`);
});
