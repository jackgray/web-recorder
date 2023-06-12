require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const FormData = require("form-data");
const mime = require("mime");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
ffmpeg.setFfmpegPath(ffmpegPath);
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3001;
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const WHISPER_PORT = process.env.WHISPER_PORT || 9000;
const CLIENT_ENDPOINT =
  process.env.CLIENT_ENDPOINT || `http://localhost:${CLIENT_PORT}`;
const WHISPER_ENDPOINT =
  process.env.WHISPER_ENDPOINT || `http://localhost:${WHISPER_PORT}`;

apiRoutes = express.Router();

// Middlewares
// app.use(
//   cors({
//     origin: CLIENT_ENDPOINT,
//   })
// );

app.use(express.json());

// Serving JSON files
apiRoutes.get("/config/:filename", (req, res) => {
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

apiRoutes.use("/config", express.static("/app/data/config"));
apiRoutes.use("/audio", express.static("/app/data/audio"));
apiRoutes.use("/upload", express.static("/app/data/uploads"));

app.use("/api", apiRoutes);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/app/data/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname}.ogg`);
  },
});

const upload = multer({ storage: storage }).single("audio");

apiRoutes.post("/upload", upload, async (req, res) => {
  try {
    console.log("Checking req: ", req);
    console.log("Checking req.file: ", req.file);
    const audioFile = req.file;

    // Get the original file name, remove the extension, and add .mp3
    const filename = path.parse(audioFile.originalname).name;
    console.log("Filename: ", filename);
    const tempFilePath = audioFile.path;
    const mp3OutputPath = `/app/data/audio/${filename}.mp3`;
    const mp3DownloadUrl = `/api/audio/${filename}.mp3`;
    const transcriptPath = `/app/data/transcripts/${filename}.json`;
    const transcriptDownloadUrl = `/api/transcripts/${filename}.json`;

    await convertToMP3(tempFilePath, mp3OutputPath);
    res.json({
      url: mp3DownloadUrl,
      filename: `${filename}.mp3`,
    });
    if (res.status === 200) {
      const whisperRes = await callWhisperAPI(mp3OutputPath);

      if (whisperRes.status === 200) {
        fs.writeFileSync(transcriptPath, JSON.stringify(whisperRes.data));
      } else {
        console.error(
          "Error calling the Whisper API: ",
          error,
          whisperRes.status
        );
        console.log("Whisper integration error");
      }
    } else {
      console.log("There may have been a problem converting the file to MP3");
    }
  } catch (error) {
    console.log(
      "Error getting webm file from client or converting to MP3:",
      error
    );
    console.log("Conversion or transcription failed.");
    // return res.status(500).send({ error: "File conversion error" });
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
  const audioBuffer = fs.readFileSync(mp3OutputPath);
  // const bufferToStream = (buffer) => {
  // return Readable.from(buffer  );
  // }
  // const audioStream = bufferToStream(audioBuffer.buffer);
  const audioForm = new FormData();
  audioForm.append("audio_file", audioBuffer, {
    filename: path.basename(mp3OutputPath),
    contentType: mime.lookup(mp3OutputPath),
  });

  var requestOptions = {
    method: "POST",
    body: audioForm,
  };

  return axios.post(WHISPER_ENDPOINT, requestOptions, {
    params: {
      task: "transcribe",
      language: "en",
      output: "json",
    },
    headers: {
      ...audioForm.getHeaders(),
    },
  });
}

app.listen(EXPRESS_PORT, () => {
  console.log(`Server is running on port ${EXPRESS_PORT}`);
  console.log(`CORS enabled: allowing requests only from ${CLIENT_ENDPOINT}`);
});
