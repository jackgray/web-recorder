const express = require('express');
const app = express();
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const SERVER_PORT = process.env.SERVER_PORT || 3001;

// Serve the client app (App.js) from the 'build' folder
app.use(express.static('build'));

// Publish the server endpoint supplied by its .env variable so that App.js can fetch it
app.get('/config', (req, res) => {
    const config = {
       SERVER_ENDPOINT: process.env.SERVER_ENDPOINT || `http://localhost:${SERVER_PORT}`
    };
    res.json(config);
 });
 

app.listen(CLIENT_PORT, () => {
   console.log(`React server is running on port ${CLIENT_PORT}`);
});
