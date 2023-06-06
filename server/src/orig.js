require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const https = require("https");
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const CLIENT_ENDPOINT =
  process.env.CLIENT_ENDPOINT || `http://localhost:${CLIENT_PORT}`;
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
ffmpeg.setFfmpegPath(ffmpegPath);

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
// app.use('/ssl', express.static(path.join(__dirname, 'var/ssl')));

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
    cb(null, "/app/data/audio");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }).single("audio");

app.post("/uploads", upload, async (req, res) => {
  try {
    console.log("Checking req: ", req);
    console.log("Checking req.file: ", req.file);
    const audioFile = req.file;

    // Get the original file name, remove the extension, and add .mp3
    const filename = path.parse(audioFile.originalname).name + ".mp3";
    console.log("Filename: ", filename);
    const tempFilePath = audioFile.path;
    const mp3OutputPath = `/app/data/audio/${filename}`;

    // Convert the WebM file to MP3
    ffmpeg(tempFilePath)
      .outputOptions("-c:a libmp3lame")
      .toFormat("mp3")
      .save(mp3OutputPath)
      .on("end", () => {
        // Delete original
        fs.unlinkSync(tempFilePath);

        // Send the MP3 file to the client
        res.json({
          filename: filename + ".mp3",
          url: `/data/audio/${filename}`,
        });
      })
      .on("error", (err) => {
        console.error("Error converting the audio file:", err);
        res.status(500).send({ error: "Error converting the audio file" });
      });
  } catch (err) {
    console.error("Error processing the audio file: ", err);
    res.status(500).send({ error: "Error processing the audio file" });
  }
});

let server;
try {
  server = https.createServer(options, app);
} catch (e) {
  console.error("Error creating HTTPS server:", e);
  // If HTTPS server creation fails, fallback to HTTP
  server = express();
}

server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
  console.log(`CORS enabled: allowing requests only from ${CLIENT_ENDPOINT}`);
});
