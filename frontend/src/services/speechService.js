class SpeechService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.supported = false;
      return;
    }

    this.supported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onListeningStart = null;
    this.onListeningEnd = null;

    this.setupRecognitionHandlers();
  }

  setupRecognitionHandlers() {
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onListeningStart) {
        this.onListeningStart();
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onListeningEnd) {
        this.onListeningEnd();
      }
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResult) {
        this.onResult({
          final: finalTranscript || interimTranscript,
          interim: interimTranscript,
          isFinal: !!finalTranscript,
        });
      }
    };

    this.recognition.onerror = (event) => {
      if (this.onError) {
        this.onError(event.error);
      }
    };
  }

  startListening() {
    if (!this.supported) {
      throw new Error('Speech Recognition API not supported');
    }
    this.recognition.start();
  }

  stopListening() {
    if (this.supported) {
      this.recognition.stop();
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-Speech API not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  isSupported() {
    return this.supported;
  }

  abort() {
    if (this.supported && this.isListening) {
      this.recognition.abort();
    }
  }
}

const speechService = new SpeechService();
export default speechService;
