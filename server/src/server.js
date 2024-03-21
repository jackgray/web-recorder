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
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const Minio = require('minio');
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
ffmpeg.setFfmpegPath(ffmpegPath);
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const WHISPER_PORT = process.env.WHISPER_PORT || 3002;
const CLIENT_ENDPOINT =
  process.env.CLIENT_ENDPOINT || `http://localhost:${CLIENT_PORT}`;
const WHISPER_ENDPOINT =
  process.env.WHISPER_ENDPOINT || `http://localhost:${WHISPER_PORT}`;

apiRoutes = express.Router();

// Middlewares
app.use(
  cors({
    origin: CLIENT_ENDPOINT
  })
);

app.use(express.json());

  /////////////////
// SEND CONFIGS  //
 ////////////////
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


  /////////////////
// FILE  STORAGE //
 ////////////////

 // Determine if S3 is AWS or MinIO
const STORAGE_TYPE = process.env.STORAGE_TYPE;

let s3Client;
if (STORAGE_TYPE === 'aws') {
// Initialize both S3 and local disk storage for fallback on failed save
  s3Client = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT,
    s3ForcePathStyle: true,   // required for MinIO
    signatureVersion: 'v4'
  });

  s3Client = new Minio.Client({
    endPoint: process.env.AWS_S3_ENDPOINT,
    useSSL: false,
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY
  });

}

// const s3Storage = multerS3({
//   s3: s3,
//   bucket: function (req, file, cb) {
//     cb(null, req.body.study); // study name = bucket name
//   },
//   contentType: multerS3.AUTO_CONTENT_TYPE,
//   key: function (req, file, cb) {
//     const filePath = `sourcedata/audio/${req.body.task}/${file.originalname}.ogg`;
//     cb(null, filePath)
//   }
// })

// const diskStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = `/app/data/${req.body.study}/sourcedata/audio/${req.body.task}/`
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${file.originalname}.ogg`);
//   },
// });


// Custom storage engine 
// const storage = (req, file, cb) => {
//   s3Storage._handleFile(req, file, (error, info) => {
//     if (error) {
//       // If S3 storage fails, fallback to local disk
//       diskStorage._handleFile(req, file, cb);
//     } else {
//       cb(null, info);
//     }
//   });
// };

// Temporarily store incoming file into memory for conversion
const buffer = multer.memoryStorage();  // Store tmp file to memory
const upload = multer({ storage: buffer }).single("audio");

  /////////////////
// ROUTER CONFIG //
 ////////////////
apiRoutes.use("/config", express.static("/app/data/config")); 
apiRoutes.post("/upload", upload, async (req, res) => {
  // Attempt S3 upload first
  try {
    console.log("Checking req: ", req);
    console.log("Checking req.file: ", req.file);
    const audioFile = req.file;

    // Get the original file name, remove the extension, and add .mp3
    const filename = path.parse(audioFile.originalname).name;
    console.log("Filename: ", filename);
    const tempFilePath = audioFile.path;
    // const mp3OutputPath = `/app/data/audio/${filename}.mp3`; // changing to use s3
    const mp3OutputPath = `${path.dirname(tempFilePath)}/${filename}.mp3`
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

// make routes accessible at serverEndpoint/api
app.use("/api", apiRoutes);




  /////////////////
//  TRANSCRIBE   //
 ////////////////
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


  /////////////////
//    SERVER     //
 ////////////////
app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
  console.log(`CORS enabled: allowing requests only from ${CLIENT_ENDPOINT}`);
});
