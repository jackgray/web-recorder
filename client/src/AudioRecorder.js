import React, { useState, useEffect } from "react";

const AudioRecorder = () => {
  const [audioStream, setAudioStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const [gainValue, setGainValue] = useState(1);

  useEffect(() => {
    // Request access to the user's microphone
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        setAudioStream(stream);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });

    // Clean up the audio context and stream when the component is unmounted
    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (audioStream) {
      // Create the audio context and set up the Web Audio API nodes
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(audioStream);
      const analyserNode = context.createAnalyser();
      const gainNode = context.createGain();

      // Connect the nodes
      source.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(context.destination);

      // Set the initial gain value
      gainNode.gain.setValueAtTime(gainValue, context.currentTime);

      // Store the created nodes in state
      setAudioContext(context);
      setAnalyser(analyserNode);
      setGainNode(gainNode);
    }
  }, [audioStream, gainValue]);

  useEffect(() => {
    // Process the audio data and update the visualization on each audio frame
    const processAudio = () => {
      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        // Calculate the average amplitude
        const amplitude = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

        // Update the visualization or perform other actions based on the amplitude

        requestAnimationFrame(processAudio);
      }
    };

    // Start the audio processing
    processAudio();
  }, [analyser]);

  const handleGainChange = (event) => {
    const newGainValue = parseFloat(event.target.value);
    setGainValue(newGainValue);
    if (gainNode) {
      gainNode.gain.setValueAtTime(newGainValue, audioContext.currentTime);
    }
  };

  return (
    <div>
      <input
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={gainValue}
        onChange={handleGainChange}
      />
      {/* Render the visualization component here */}
    </div>
  );
};

export default AudioRecorder;
