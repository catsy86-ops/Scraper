// Content quality utilities: markdown cleanup, image extraction, quality scoring.

export interface ExtractedImage {
  url: string;
  alt: string;
  title?: string;
}

export interface QualityReport {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  charCount: number;
  wordCount: number;
  paragraphs: number;
  headings: number;
  links: number;
  images: number;
  codeBlocks: number;
  warnings: string[];
}

// ---- Cleanup ----------------------------------------------------------------

const NOISE_PATTERNS: RegExp[] = [
  // Cookie / privacy banners
  /^.*(akcept(uj|owa)|accept|zgadzam się|i agree|cookie[s]?|privacy policy|polityka prywatności|używamy plików cookie|we use cookies).*$/gim,
  // Newsletter / subscribe prompts
  /^.*(subscribe to our newsletter|zapisz się do newslettera|sign up for our newsletter).*$/gim,
  // Common nav/footer leftovers
  /^.*(skip to (main )?content|przejdź do (głównej )?treści|toggle navigation|menu główne).*$/gim,
  // Social share rows
  /^(\s*\[?(share|udostępnij|tweet|facebook|linkedin|whatsapp|email)\]?\s*[\|·•\-]?\s*){2,}.*$/gim,
  // Ad markers
  /^.*(reklama|advertisement|sponsored content|sponsorowane)\s*$/gim,
];

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'ref_src',
];

function stripTrackingFromUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const p of TRACKING_PARAMS) u.searchParams.delete(p);
    return u.toString();
  } catch {
    return url;
  }
}

export function cleanMarkdown(md: string): { cleaned: string; removedChars: number } {
  if (!md) return { cleaned: '', removedChars: 0 };
  const original = md.length;
  let out = md;

  // Remove HTML comments
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  // Remove inline scripts/styles if any leaked
  out = out.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  // Apply noise patterns
  for (const re of NOISE_PATTERNS) out = out.replace(re, '');
  // Strip tracking params from markdown links [text](url)
  out = out.replace(/\]\((https?:\/\/[^)\s]+)\)/g, (_m, url) => `](${stripTrackingFromUrl(url)})`);
  // Collapse 3+ blank lines into 2
  out = out.replace(/\n{3,}/g, '\n\n');
  // Trim leading/trailing whitespace
  out = out.trim();

  return { cleaned: out, removedChars: Math.max(0, original - out.length) };
}

// ---- Image extraction -------------------------------------------------------

export function extractImages(md: string): ExtractedImage[] {
  if (!md) return [];
  const images: ExtractedImage[] = [];
  const seen = new Set<string>();

  // ![alt](url "title")
  const mdRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdRe.exec(md)) !== null) {
    const url = m[2];
    if (seen.has(url)) continue;
    seen.add(url);
    images.push({ alt: m[1] || '', url, title: m[3] });
  }

  // <img src alt> fallback
  const htmlRe = /<img\b[^>]*?src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  while ((m = htmlRe.exec(md)) !== null) {
    const url = m[1];
    if (seen.has(url)) continue;
    seen.add(url);
    images.push({ alt: m[2] || '', url });
  }

  return images;
}

// ---- Quality scoring --------------------------------------------------------

export function analyzeQuality(md: string): QualityReport {
  const text = md || '';
  const charCount = text.length;
  const words = text.match(/\b[\p{L}\p{N}'-]+\b/gu) || [];
  const wordCount = words.length;
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 40).length;
  const headings = (text.match(/^#{1,6}\s+\S/gm) || []).length;
  const links = (text.match(/\]\(https?:\/\//g) || []).length;
  const images = extractImages(text).length;
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;

  const warnings: string[] = [];
  if (charCount < 300) warnings.push('Bardzo mało treści — możliwe że strona wymaga waitFor lub renderuje JS');
  if (wordCount > 0 && headings === 0 && charCount > 800) warnings.push('Brak nagłówków — struktura może być niska');
  if (paragraphs === 0 && charCount > 500) warnings.push('Brak wyraźnych akapitów');
  const linkRatio = wordCount > 0 ? links / Math.max(1, wordCount / 50) : 0;
  if (linkRatio > 4) warnings.push('Wysoka gęstość linków — możliwa nawigacja zamiast treści');

  // Score components
  let score = 0;
  score += Math.min(40, Math.log10(Math.max(10, charCount)) * 12); // length
  score += Math.min(20, headings * 4); // structure
  score += Math.min(15, paragraphs * 1.2); // paragraphs
  score += Math.min(10, images * 2); // media
  score += Math.min(10, codeBlocks * 3); // technical
  score += 5; // baseline if any content
  if (charCount === 0) score = 0;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const level: QualityReport['level'] = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return { score, level, charCount, wordCount, paragraphs, headings, links, images, codeBlocks, warnings };
}
