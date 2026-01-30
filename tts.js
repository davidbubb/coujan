// Minimal TTS helper using Web Speech API
// Exports ttsSpeak({text, lang, rate, pitch})
function _selectVoice(langCandidate) {
  const voices = window.speechSynthesis.getVoices();
  // prefer exact lang match then startsWith
  let v = voices.find(v => v.lang && v.lang.toLowerCase() === langCandidate.toLowerCase());
  if (!v) v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCandidate.split('-')[0]));
  return v || voices[0] || null;
}

function ttsSpeak({ text = '', lang = 'zh-CN', rate = 0.9, pitch = 1.0 } = {}) {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported in this browser.');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = pitch;

  // ensure voices loaded
  const speakNow = () => {
    const voice = _selectVoice(lang);
    if (voice) utter.voice = voice;
    // gentle volume handling is left to user device
    window.speechSynthesis.cancel(); // stop previous
    window.speechSynthesis.speak(utter);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    // some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => speakNow();
  } else {
    speakNow();
  }
}

// export helper in global scope for the example
window.ttsSpeak = ttsSpeak;