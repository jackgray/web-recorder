export class MediaRecorder {
    constructor() {
      this.mediaRecorder = null;
      this.recordedBlobs = [];
    }
  
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      this.recordedBlobs = [];
      this.mediaRecorder = new window.MediaRecorder(stream, {
        mimeType: 'audio/ogg;codecs=opus',
      });
  
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedBlobs.push(event.data);
        }
      };
  
      this.mediaRecorder.start();
    }
  
    stop() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
    }
  
    async getRecordedBlob() {
      if (!this.mediaRecorder) {
        throw new Error('MediaRecorder is not initialized');
      }
  
      return new Blob(this.recordedBlobs, { type: 'audio/ogg;codecs=opus' });
    }
  }
  