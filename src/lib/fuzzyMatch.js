// Case-insensitive exact match OR Levenshtein distance <=1, for text-answer
// questions -- tolerates a single typo.
export function isCorrectTextAnswer(input, answer) {
  const a = (input || '').trim().toLowerCase()
  const b = (answer || '').trim().toLowerCase()
  if (!a) return false
  if (a === b) return true
  return levenshtein(a, b) <= 1
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 1) return 2 // short-circuit, we only care about <=1
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}
