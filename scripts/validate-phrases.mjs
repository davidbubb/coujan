import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dataPath = path.resolve('src/data/phrases.mvp.json');

function isValidDateTime(value) {
  if (!value) return true;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function requireString(value, fieldName, issues, id) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push(`${id}: missing or empty ${fieldName}`);
  }
}

async function main() {
  const raw = await readFile(dataPath, 'utf8');
  const json = JSON.parse(raw);
  const issues = [];

  if (!json || !Array.isArray(json.phrases)) {
    throw new Error('Invalid shape: root object must contain a "phrases" array.');
  }

  const ids = new Set();

  json.phrases.forEach((phrase, phraseIndex) => {
    const id = phrase?.id || `phrase_at_index_${phraseIndex}`;

    requireString(phrase?.id, 'id', issues, id);
    requireString(phrase?.english, 'english', issues, id);
    requireString(phrase?.context, 'context', issues, id);
    requireString(phrase?.mandarin?.characters_simplified, 'mandarin.characters_simplified', issues, id);
    requireString(phrase?.mandarin?.characters_traditional, 'mandarin.characters_traditional', issues, id);
    requireString(phrase?.mandarin?.pinyin, 'mandarin.pinyin', issues, id);
    requireString(phrase?.cantonese?.characters_traditional, 'cantonese.characters_traditional', issues, id);
    requireString(phrase?.cantonese?.jyutping, 'cantonese.jyutping', issues, id);

    if (typeof phrase?.id === 'string') {
      if (ids.has(phrase.id)) {
        issues.push(`${id}: duplicate id`);
      }
      ids.add(phrase.id);
    }

    if (phrase?.tags && (!Array.isArray(phrase.tags) || phrase.tags.some((tag) => typeof tag !== 'string' || !tag.trim()))) {
      issues.push(`${id}: tags must be an array of non-empty strings`);
    }

    if (!isValidDateTime(phrase?.created_at)) {
      issues.push(`${id}: created_at is not a valid date-time`);
    }
  });

  if (issues.length > 0) {
    console.error(`Data validation failed with ${issues.length} issue(s):`);
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  console.log(`Data validation passed for ${json.phrases.length} phrase(s).`);
}

main().catch((error) => {
  console.error('Data validation crashed:', error.message);
  process.exit(1);
});