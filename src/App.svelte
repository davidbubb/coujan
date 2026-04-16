<script>
  import { onMount } from 'svelte';
  import phrasesData from './data/phrases.mvp.json';
  import { ttsSpeak } from './lib/tts.js';

  // state
  let phrases = phrasesData.phrases || [];
  let index = 0;
  let selectedTag = localStorage.getItem('selectedTag') || 'all';
  let favoritesOnly = localStorage.getItem('favoritesOnly') === 'true';
  let showPinyin = true;
  let mandarinScript = localStorage.getItem('mandarinScript') || 'simplified'; // 'simplified' or 'traditional'
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  let theme = localStorage.getItem('theme') || 'light';
  let animationsEnabled = localStorage.getItem('animationsEnabled') !== 'false'; // default to true
  const themeClasses = ['theme-dark', 'theme-ocean', 'theme-sunset', 'theme-purple', 'theme-neon', 'theme-tropical', 'theme-cherry', 'theme-aurora'];

  $: availableTags = Array.from(new Set(phrases.flatMap((phrase) => phrase.tags || []))).sort();
  $: if (selectedTag !== 'all' && !availableTags.includes(selectedTag)) {
    selectedTag = 'all';
  }
  $: filteredPhrases = phrases.filter((phrase) => {
    const matchesFavorite = !favoritesOnly || favorites.includes(phrase.id);
    const matchesTag = selectedTag === 'all' || (phrase.tags || []).includes(selectedTag);
    return matchesFavorite && matchesTag;
  });
  $: if (index >= filteredPhrases.length) index = 0;
  $: currentPhrase = filteredPhrases[index] || null;
  $: localStorage.setItem('selectedTag', selectedTag);
  $: localStorage.setItem('favoritesOnly', favoritesOnly.toString());

  function setMandarinScript(s) {
    mandarinScript = s;
    localStorage.setItem('mandarinScript', s);
  }

  function setTheme(t) {
    theme = t;
    localStorage.setItem('theme', t);
    updateBodyClass();
  }

  function toggleAnimations() {
    animationsEnabled = !animationsEnabled;
    localStorage.setItem('animationsEnabled', animationsEnabled.toString());
    updateBodyClass();
  }

  function updateBodyClass() {
    if (typeof document !== 'undefined') {
      themeClasses.forEach((className) => document.body.classList.remove(className));
      if (theme !== 'light') document.body.classList.add(`theme-${theme}`);
      document.body.classList.toggle('animations-disabled', !animationsEnabled);
    }
  }

  function toggleFavorite(id) {
    favorites = favorites.includes(id)
      ? favorites.filter((favoriteId) => favoriteId !== id)
      : [...favorites, id];
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  function isFavorite(id) {
    return favorites.includes(id);
  }

  function next() {
    if (!filteredPhrases.length) return;
    index = (index + 1) % filteredPhrases.length;
    prefetchNext();
  }
  function prev() {
    if (!filteredPhrases.length) return;
    index = (index - 1 + filteredPhrases.length) % filteredPhrases.length;
    prefetchNext();
  }

  // simple prefetch placeholder (for future service worker)
  function prefetchNext() {
    // no-op now
  }

  function playMandarin() {
    if (!currentPhrase) return;
    const text = mandarinScript === 'simplified' ? currentPhrase.mandarin.characters_simplified : currentPhrase.mandarin.characters_traditional;
    // speak using Mandarin zh-CN
    ttsSpeak({ text, lang: 'zh-CN' });
  }

  function playCantonese() {
    if (!currentPhrase) return;
    const text = currentPhrase.cantonese.characters_traditional;
    // many browsers do not have 'yue' voices; try zh-HK / zh-CN fallback. Use 'yue' first.
    ttsSpeak({ text, lang: 'zh-HK' });
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
    // apply initial body class
    updateBodyClass();
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
  <section class="card" role="article" aria-label="Calming phrase" on:touchstart={onTouchStart} on:touchend={onTouchEnd}>

    <div class="controls-top">
      <div class="left-controls">
        <label class="small" for="mandy">Mandarin</label>
        <select id="mandy" bind:value={mandarinScript} on:change={() => setMandarinScript(mandarinScript)}>
          <option value="simplified">Simplified</option>
          <option value="traditional">Traditional</option>
        </select>
        <label class="small" for="tag-filter">Tag</label>
        <select id="tag-filter" bind:value={selectedTag}>
          <option value="all">All tags</option>
          {#each availableTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
        <label class="small">
          <input type="checkbox" bind:checked={favoritesOnly} /> Favorites only
        </label>
        <label class="small">
          <input type="checkbox" bind:checked={showPinyin} /> Show romanization
        </label>
      </div>

      <div class="right-controls">
        <div class="count" aria-live="polite">{filteredPhrases.length} / {phrases.length} phrases</div>
        <button class="fav" on:click={() => currentPhrase && toggleFavorite(currentPhrase.id)} aria-pressed={currentPhrase ? isFavorite(currentPhrase.id) : false} disabled={!currentPhrase}>
          {#if currentPhrase && isFavorite(currentPhrase.id)}
            ★ Favorited
          {:else}
            ☆ Favorite
          {/if}
        </button>
        <button class="animation-toggle" on:click={toggleAnimations} aria-label="Toggle animations" title={animationsEnabled ? 'Disable animations' : 'Enable animations'}>
          {#if animationsEnabled}
            ✨ Animations On
          {:else}
            ⏸️ Animations Off
          {/if}
        </button>
      </div>
    </div>

    {#if currentPhrase}
      <div class="languages">
        <div class="col mandarin" aria-label="Mandarin column">
          <div class="label">Mandarin</div>
          <div class="chars">
            {#if mandarinScript === 'simplified'}
              {currentPhrase.mandarin.characters_simplified}
            {:else}
              {currentPhrase.mandarin.characters_traditional}
            {/if}
          </div>
          {#if showPinyin}
            <div class="romanization">{currentPhrase.mandarin.pinyin}</div>
          {/if}
          <button class="play" on:click={playMandarin} aria-label="Play Mandarin">🔊</button>
        </div>

        <div class="col cantonese" aria-label="Cantonese column">
          <div class="label">Cantonese</div>
          <div class="chars">{currentPhrase.cantonese.characters_traditional}</div>
          {#if showPinyin}
            <div class="romanization">{currentPhrase.cantonese.jyutping}</div>
          {/if}
          <button class="play" on:click={playCantonese} aria-label="Play Cantonese">🔊</button>
        </div>
      </div>

      <div class="english" aria-live="polite">
        <div class="translation">{currentPhrase.english}</div>
        <div class="context">{currentPhrase.context}</div>
      </div>
    {:else}
      <div class="english" aria-live="polite">
        <div class="translation">No phrases match the current filters.</div>
        <div class="context">Try another tag or turn off Favorites only.</div>
      </div>
    {/if}

    <div class="controls">
      <button on:click={prev} aria-label="Previous phrase" disabled={!currentPhrase}>← Prev</button>
      <button on:click={next} aria-label="Next phrase" disabled={!currentPhrase}>Next →</button>
    </div>

    <div class="theme-controls">
      <button class="theme-btn" class:active={theme === 'light'} on:click={() => setTheme('light')}>☀️ Light</button>
      <button class="theme-btn" class:active={theme === 'dark'} on:click={() => setTheme('dark')}>🌙 Dark</button>
      <button class="theme-btn" class:active={theme === 'ocean'} on:click={() => setTheme('ocean')}>🌊 Ocean</button>
      <button class="theme-btn" class:active={theme === 'sunset'} on:click={() => setTheme('sunset')}>🌅 Sunset</button>
      <button class="theme-btn" class:active={theme === 'purple'} on:click={() => setTheme('purple')}>💜 Purple</button>
      <button class="theme-btn" class:active={theme === 'neon'} on:click={() => setTheme('neon')}>⚡ Neon</button>
      <button class="theme-btn" class:active={theme === 'tropical'} on:click={() => setTheme('tropical')}>🌴 Tropical</button>
      <button class="theme-btn" class:active={theme === 'cherry'} on:click={() => setTheme('cherry')}>🌸 Cherry</button>
      <button class="theme-btn" class:active={theme === 'aurora'} on:click={() => setTheme('aurora')}>✨ Aurora</button>
    </div>

  </section>
</main>

<style>
  /* small inline fallback in case external CSS fails */
  @import './styles.css';
</style>