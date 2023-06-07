// Create a gain node to control the input gain
const gainNode = audioContext.createGain();

// Adjust the input gain using a range input or other UI elements
function handleGainChange(event) {
  const gainValue = event.target.value;
  gainNode.gain.setValueAtTime(gainValue, audioContext.currentTime);
}

// Connect the gain node to the audio source
source.connect(gainNode);
gainNode.connect(analyser);
