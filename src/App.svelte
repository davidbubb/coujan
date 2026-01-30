<script>
  import { onMount } from 'svelte';
  import phrasesData from './data/phrases.mvp.json';
  import { ttsSpeak } from './lib/tts.js';

  // state
  let phrases = phrasesData.phrases || [];
  let index = 0;
  let showPinyin = true;
  let mandarinScript = localStorage.getItem('mandarinScript') || 'simplified'; // 'simplified' or 'traditional'
  let reducedMotion = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || false;
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

  // persist script preference
  function setMandarinScript(s) {
    mandarinScript = s;
    localStorage.setItem('mandarinScript', s);
  }

  function toggleFavorite(id) {
    const i = favorites.indexOf(id);
    if (i >= 0) favorites.splice(i,1);
    else favorites.push(id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  function isFavorite(id) {
    return favorites.includes(id);
  }

  function next() {
    index = (index + 1) % phrases.length;
    prefetchNext();
  }
  function prev() {
    index = (index - 1 + phrases.length) % phrases.length;
    prefetchNext();
  }

  // simple prefetch placeholder (for future service worker)
  function prefetchNext() {
    // no-op now
  }

  function playMandarin() {
    const phrase = phrases[index];
    const text = mandarinScript === 'simplified' ? phrase.mandarin.characters_simplified : phrase.mandarin.characters_traditional;
    // speak using Mandarin zh-CN
    ttsSpeak({ text, lang: 'zh-CN' });
  }

  function playCantonese() {
    const phrase = phrases[index];
    const text = phrase.cantonese.characters_traditional;
    // many browsers do not have 'yue' voices; try zh-HK / zh-CN fallback. Use 'yue' first.
    ttsSpeak({ text, lang: 'yue' });
  }

  // keyboard navigation
  function onKey(e) {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  }

  onMount(() => {
    window.addEventListener('keydown', onKey);
    // ensure favorites loaded
    favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    // small: prefetch next
    prefetchNext();
    return () => window.removeEventListener('keydown', onKey);
  });

  // swipe handling for mobile (basic)
  let touchStartX = 0;
  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
  }
</script>

<main class="app">
  <section class="card" role="article" aria-label="Calming phrase"
    on:touchstart={onTouchStart} on:touchend={onTouchEnd}>

    <div class="controls-top">
      <div class="left-controls">
        <label class="small">Mandarin</label>
        <select bind:value={mandarinScript} on:change={() => setMandarinScript(mandarinScript)}>
          <option value="simplified">Simplified</option>
          <option value="traditional">Traditional</option>
        </select>
        <label class="small">
          <input type="checkbox" bind:checked={showPinyin} /> Show romanization
        </label>
      </div>

      <div class="right-controls">
        <button class="fav" on:click={() => toggleFavorite(phrases[index].id)} aria-pressed={isFavorite(phrases[index].id)}>
          {#if isFavorite(phrases[index].id)}★ Favorited{else}☆ Favorite{/if}
        </button>
      </div>
    </div>

    <div class="languages">
      <div class="col mandarin" aria-label="Mandarin column">
        <div class="label">Mandarin</div>
        <div class="chars">
          {#if mandarinScript === 'simplified'}
            {@html phrases[index].mandarin.characters_simplified}
          {:else}
            {@html phrases[index].mandarin.characters_traditional}
          {/if}
        </div>
        {#if showPinyin}
          <div class="romanization">{phrases[index].mandarin.pinyin}</div>
        {/if}
        <button class="play" on:click={playMandarin} aria-label="Play Mandarin">🔊</button>
      </div>

      <div class="col cantonese" aria-label="Cantonese column">
        <div class="label">Cantonese</div>
        <div class="chars">{@html phrases[index].cantonese.characters_traditional}</div>
        {#if showPinyin}
          <div class="romanization">{phrases[index].cantonese.jyutping}</div>
        {/if}
        <button class="play" on:click={playCantonese} aria-label="Play Cantonese">🔊</button>
      </div>
    </div>

    <div class="english" aria-live="polite">
      <div class="translation">{phrases[index].english}</div>
      <div class="context">{phrases[index].context}</div>
    </div>

    <div class="controls">
      <button on:click={prev} aria-label="Previous phrase">← Prev</button>
      <button on:click={next} aria-label="Next phrase">Next →</button>
    </div>

  </section>
</main>

<style>
  /* small inline fallback in case external CSS fails */
  @import './styles.css';
</style>