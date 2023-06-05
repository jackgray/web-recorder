const got = require('got');

const WHISPER_ENDPOINT = process.env.WHISPER_ENDPOINT || '$WHISPER_ENDPOINT';

async function transcribeAudio(audioFilePath) {
  try {
    const response = await axios.post(WHISPER_ENDPOINT, {
        audio: fs.createReadStream(audioFilePath),
      });

    return response;
  } catch (error) {
    console.error('Error calling the Whisper API:', error.response.body);
    throw new Error('Whisper integration error');
  }
}

module.exports = { transcribeAudio };
