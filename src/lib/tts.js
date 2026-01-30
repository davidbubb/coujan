// Minimal TTS module using Web Speech API
export function _selectVoice(langCandidate) {
  const voices = window.speechSynthesis.getVoices();
  // try exact then prefix
  let v = voices.find(v => v.lang && v.lang.toLowerCase() === langCandidate.toLowerCase());
  if (!v) v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCandidate.split('-')[0]));
  return v || voices[0] || null;
}

export function ttsSpeak({ text = '', lang = 'zh-CN', rate = 0.9, pitch = 1.0 } = {}) {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported in this browser.');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = pitch;

  const speakNow = () => {
    const voice = _selectVoice(lang);
    if (voice) utter.voice = voice;
    window.speechSynthesis.cancel(); // stop previous to avoid overlap
    window.speechSynthesis.speak(utter);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => speakNow();
  } else {
    speakNow();
  }
}