let isSpeaking = false;
const queue: string[] = [];
let selectedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;
let onSpeakingStateChange: (isSpeaking: boolean) => void = () => {};

export const setSpeakingStateCallback = (
  callback: (isSpeaking: boolean) => void
) => {
  onSpeakingStateChange = callback;
};

const selectBestVoice = (
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null => {
  const preferredVoices = [
    "Google US English",
    "Google UK English Female",
    "Google UK English Male",

    "Microsoft Zira Desktop",
    "Microsoft David Desktop",
    "Microsoft Mark",

    "Alex",
    "Samantha",
    "Victoria",

    "Daniel",
    "Karen",
    "Moira",
    "Tessa",
  ];

  for (const preferred of preferredVoices) {
    const voice = voices.find((v) => v.name.includes(preferred));
    if (voice) {
      console.log(`Selected voice: ${voice.name}`);
      return voice;
    }
  }

  const englishVoices = voices.filter(
    (v) =>
      v.lang.startsWith("en") &&
      !v.name.toLowerCase().includes("novelty") &&
      !v.name.toLowerCase().includes("whisper")
  );

  const femaleVoice = englishVoices.find(
    (v) =>
      v.name.toLowerCase().includes("female") ||
      v.name.toLowerCase().includes("woman") ||
      ["Samantha", "Victoria", "Karen", "Moira", "Tessa", "Zira"].some((name) =>
        v.name.includes(name)
      )
  );

  if (femaleVoice) {
    console.log(`Selected female voice: ${femaleVoice.name}`);
    return femaleVoice;
  }

  const defaultVoice = englishVoices[0] || voices[0];
  console.log(`Selected default voice: ${defaultVoice?.name}`);
  return defaultVoice;
};

const loadVoices = () => {
  const voices = window.speechSynthesis.getVoices();

  if (voices.length === 0) {
    return;
  }

  selectedVoice = selectBestVoice(voices);
  voicesLoaded = true;

  console.log(`Loaded ${voices.length} voices, selected:`, selectedVoice?.name);
};

const ensureVoicesLoaded = (): Promise<void> => {
  return new Promise((resolve) => {
    if (voicesLoaded && selectedVoice) {
      resolve();
      return;
    }

    const checkVoices = () => {
      loadVoices();
      if (voicesLoaded && selectedVoice) {
        resolve();
      } else {
        setTimeout(checkVoices, 100);
      }
    };

    checkVoices();
  });
};

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices(); 
}

export const speak = async (text: string) => {
  if (!text || !text.trim()) return;

  const cleanText = text
    .replace(/[^\w\s.,!?;:-]/g, "") 
    .replace(/\s+/g, " ") 
    .trim();

  if (!cleanText) return;

  queue.push(cleanText);

  if (!isSpeaking) {
    await processQueue();
  }
};

const processQueue = async (): Promise<void> => {
  if (queue.length === 0 || !window.speechSynthesis) {
    isSpeaking = false;
    onSpeakingStateChange(false);
    return;
  }

  await ensureVoicesLoaded();

  const text = queue.shift();
  if (!text) {
    isSpeaking = false;
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.lang = selectedVoice?.lang || "en-US";
  utterance.rate = 0.9; 
  utterance.pitch = 1.0; 
  utterance.volume = 0.8; 

  isSpeaking = true;
  onSpeakingStateChange(true);

  utterance.onend = () => {
    isSpeaking = false;
    setTimeout(() => {
      processQueue();
    }, 250); 
  };

  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event.error);
    isSpeaking = false;

    setTimeout(() => {
      processQueue();
    }, 500);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Failed to start speech synthesis:", error);
    isSpeaking = false;
    processQueue();
  }
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  queue.length = 0; 
  isSpeaking = false;
};

export const isSpeechSupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.speechSynthesis.speak === "function"
  );
};

export const listAvailableVoices = () => {
  if (!window.speechSynthesis) {
    console.log("Speech synthesis not supported");
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  console.log("Available voices:");
  voices.forEach((voice, index) => {
    console.log(
      `${index}: ${voice.name} (${voice.lang}) - ${
        voice.default ? "Default" : "Not default"
      }`
    );
  });
};
