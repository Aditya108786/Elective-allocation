
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export const startvoiceRecognition = (oncommanddetected) => {
  const startRecognition = () => {
    if (!SpeechRecognition) {
      // Optionally show a toast or notification instead
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      oncommanddetected(transcript);
    };

    recognition.onerror = (event) => {
      // Optional: handle speech error in UI
    };
  };

  return startRecognition;
};