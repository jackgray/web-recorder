// Create a canvas element to draw the dynamic bar
const canvas = document.createElement("canvas");
const canvasCtx = canvas.getContext("2d");
// Set up the canvas size and properties

// Process the audio data and update the dynamic bar on each audio frame
function processAudio() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  // Calculate the average amplitude
  const amplitude = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

  // Update the dynamic bar on the canvas
  // You can use the amplitude value to adjust the size, color, or position of the bar
  // Use canvasCtx.fillRect(), canvasCtx.clearRect(), or other canvas methods

  requestAnimationFrame(processAudio);
}

// Start the audio processing
source.connect(analyser);
processAudio();
