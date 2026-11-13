// Conservative correction: only use a uniquely closest word from catalog suggestions.
function distance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1,
      rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
      rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  }
  return rows[a.length][b.length];
}

export function searchCorrection(keyword, suggestions) {
  const query = keyword.trim().toLowerCase();
  if (!/^[a-z]{4,}$/.test(query)) return null;
  const names = [...(suggestions.terms || []), ...(suggestions.products || []).map(p => p.name)];
  const words = [...new Set(names.flatMap(name => (name || '').toLowerCase().match(/[a-z]+/g) || []))];
  const ranked = words.map(word => ({ word, score: distance(query, word) }))
    .filter(({ score }) => score <= (query.length >= 7 ? 2 : 1))
    .sort((a, b) => a.score - b.score);
  if (!ranked.length || ranked[0].score === 0 || ranked[1]?.score === ranked[0].score) return null;
  return ranked[0].word;
}
