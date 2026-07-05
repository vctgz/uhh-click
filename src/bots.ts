// Bots don't trip alerts. Paste a link in Slack and a dozen preview crawlers
// stampede it; a milestone email fired by robots embarrasses the product.
// Humans drive `clicks`; everything below lands in `bot_clicks`.
//
// NOTE: curl's default UA ("curl/8.x") matches this pattern on purpose. Smoke
// tests that want to count as human MUST send a browser UA.
const BOT_RE =
  /bot|crawl|spider|slurp|preview|scan|fetch|monitor|curl|wget|python-requests|httpclient|headless|lighthouse|facebookexternalhit|whatsapp|telegram|slack|discord|twitterbot|linkedin|skype|pinterest|embed|vkshare|bing|yandex|duckduck|baidu|semrush|ahrefs|mj12|dotbot|petalbot|gptbot|claudebot|perplexity|applebot|googlebot/i

export function isBot(ua: string | undefined | null, headers: Headers): boolean {
  if (!ua || ua.trim() === '') return true
  if (BOT_RE.test(ua)) return true
  const purpose = (headers.get('Sec-Purpose') || headers.get('Purpose') || '').toLowerCase()
  if (purpose.includes('prefetch') || purpose.includes('preview')) return true
  return false
}
