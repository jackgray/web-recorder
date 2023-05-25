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


// app.post("/uploads", async (req, res) => {
//   console.log("Checking req: ", req)
//   console.log("Checking req.file: ", req.file)
//   const audioFile = req.file;

//   const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//       destination: function(req, file, cb) {
//         cb(null, '/app/data/audio');
//       },
//       filename: function(req, file, cb) {
//         cb(null, file.originalname);
//       }
//     }
//   });

//   const upload = multer({ storage: storage }).single('audio');

//   upload(req, res, function(err) {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }

//     res.status(200).json({ url: '/data/audio/' + req.file.originalname })
//   })

//   // Get the original file name, remove the extension, and add .mp3
//   const filename = path.parse(audioFile.originalname).name + '.mp3';
//   console.log("Filename: ", filename)

//   const tempFilePath = audioFile.path;
//   const mp3OutputPath = `/app/data/uploads/${filename}`;

//   // Convert the WebM file to MP3
//   ffmpeg(tempFilePath)
//     .outputOptions("-c:a libmp3lame")
//     .toFormat("mp3")
//     .save(mp3OutputPath)
//     .on("end", () => {
//       // Send the MP3 file to the client
//       res.json({
//         filename: mp3OutputPath,
//         url: `/uploads/${filename}`
//       })
//       // fs.unlink(tempFilePath, (err) => {
//       //   if (err)
//       //     console.error("Error deleting the temp file:", err)
//       // });
//       // res.sendFile(path.resolve(mp3OutputPath), {}, (err) => {
//       //   if (err) {
//       //     console.error("Error sending the MP3 file:", err);
//       //     res.status(500).send({ error: "Error sending the MP3 file" });
//       //   } else {
//       //     // Delete the temporary WebM file and the MP3 file
//       //     fs.unlink(tempFilePath, (err) => {
//       //       if (err)
//       //         console.error("Error deleting the temporary WebM file:", err);
//       //     });
//       //   }
//       // });
//     })
//     .on("error", (err) => {
//       console.error("Error converting the audio file:", err);
//       res.status(500).send({ error: "Error converting the audio file" });
//     });
// });

app.post('/uploads', async (req, res) => {
  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, '/app/data/audio');
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    },
  });

  const upload = multer({ storage: storage }).single('audio');

  upload(req, res, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Assuming your file is stored at /app/data/audio/filename.mp3
    res.status(200).json({ url: '/data/audio/' + req.file.originalname });
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
