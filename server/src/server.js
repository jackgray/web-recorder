require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const https = require('https');
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const CLIENT_ENDPOINT = process.env.CLIENT_ENDPOINT || `http://localhost:${CLIENT_PORT}`;
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
ffmpeg.setFfmpegPath(ffmpegPath);

// const { exec } = require('child_process');
// exec('ls /', (err, stdout, stderr) => {
//   if (err) {
//     // If an error occurred, printing the error
//     console.error(`exec error: ${err}`);
//     return;
//   }
//   // Printing the output of the command
//   console.log(`Result: ${stdout}`);
// });


const storage = multer.diskStorage({
  destination: "/app/data/uploads",
  filename: (req, file, cb) => {
    cb(null, file.filename);
  },
});

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10 MB
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("audio/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Invalid file type"), false);
//     }
//   },
// });
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  // fileFilter: (req, file, cb) => {
  //   cb(null, true); // Accept all file types
  // },
});


let options = {};
try {
  options = {
    key: fs.readFileSync('/app/data/ssl/audio_narclab_com.key'),
    cert: fs.readFileSync('/app/data/ssl/audio_narclab_com.crt')
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
app.use('/config', express.static('/app/data/config'));
app.use('/audio', express.static('/app/data/audio'));
app.use('/uploads', express.static('/app/data/uploads'));
// app.use('/ssl', express.static(path.join(__dirname, 'var/ssl')));


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
      console.error("Error sending the file:", err);
      res.status(err.status).end();
    }
  });
});

app.post("/uploads", upload.array("audio"), async (req, res) => {
  const audioFile = req.file;
  const filename = req.body.filename;
  console.log("using file: ", audioFile);
  console.log(audioFile.path);

  const tempFilePath = audioFile.path;
  const mp3OutputPath = `/app/data/uploads/${filename}.mp3`;
  console.log('mp3 out path: ', mp3OutputPath);
  // Convert the WebM file to MP3
  ffmpeg(tempFilePath)
    .outputOptions("-c:a libmp3lame")
    .toFormat("mp3")
    .save(mp3OutputPath)
    .on("end", () => {
      // Send the MP3 file to the client
      res.sendFile(path.resolve(mp3OutputPath), {}, (err) => {
        if (err) {
          console.error("Error sending the MP3 file:", err);
          res.status(500).send({ error: "Error sending the MP3 file" });
        } else {
          // Delete the temporary WebM file and the MP3 file
          fs.unlink(tempFilePath, (err) => {
            if (err)
              console.error("Error deleting the temporary WebM file:", err);
          });

          // fs.unlink(mp3OutputPath, (err) => {
          //   if (err) 
          //     console.error("Error deleting the MP3 file:", err);
          // });
        }
      });
    })
    .on("error", (err) => {
      console.error("Error converting the audio file:", err);
      res.status(500).send({ error: "Error converting the audio file" });
    });
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
