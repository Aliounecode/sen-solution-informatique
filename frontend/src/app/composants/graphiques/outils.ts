export interface Point {
  x: number;
  y: number;
}

let compteur = 0;

/** Identifiant unique (pour les dégradés SVG de plusieurs graphiques sur la même page). */
export function idUnique(prefixe: string): string {
  compteur += 1;
  return `${prefixe}-${compteur}`;
}

function arrondir(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Courbe lissée « monotone » (Fritsch–Carlson) : elle passe par tous les points
 * et ne dépasse jamais entre deux valeurs (pas de creux sous zéro).
 */
export function cheminLisse(p: Point[]): string {
  const n = p.length;
  if (n === 0) return '';
  if (n === 1) return `M${arrondir(p[0].x)},${arrondir(p[0].y)}`;

  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1].x - p[i].x;
    m[i] = (p[i + 1].y - p[i].y) / dx[i];
  }

  const t: number[] = new Array(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }

  let d = `M${arrondir(p[0].x)},${arrondir(p[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d +=
      ` C${arrondir(p[i].x + h)},${arrondir(p[i].y + t[i] * h)}` +
      ` ${arrondir(p[i + 1].x - h)},${arrondir(p[i + 1].y - t[i + 1] * h)}` +
      ` ${arrondir(p[i + 1].x)},${arrondir(p[i + 1].y)}`;
  }
  return d;
}

/** 1 250 000 → « 1,3 M » · 45 000 → « 45 k » · 800 → « 800 ». */
export function formaterCourt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    const v = n / 1_000_000;
    return `${(a >= 10_000_000 ? Math.round(v).toString() : v.toFixed(1)).replace('.', ',').replace(',0', '')} M`;
  }
  if (a >= 1_000) {
    const v = n / 1_000;
    return `${(a >= 10_000 ? Math.round(v).toString() : v.toFixed(1)).replace('.', ',').replace(',0', '')} k`;
  }
  return Math.round(n).toString();
}

/** Graduations « rondes » de 0 jusqu'à un maximum ≥ max (ex. 0, 25 k, 50 k, 75 k, 100 k). */
export function graduationsNettes(max: number, nombre = 4): number[] {
  const cible = max > 0 ? max : nombre;
  const brut = cible / nombre;
  const magnitude = Math.pow(10, Math.floor(Math.log10(brut)));
  const r = brut / magnitude;
  const pas = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * magnitude;
  const haut = Math.ceil(cible / pas) * pas;
  const res: number[] = [];
  for (let v = 0; v <= haut + pas / 1000; v += pas) {
    res.push(Number(v.toFixed(6)));
  }
  return res;
}

/** « 2026-11-05 » → « 05/11 ». */
export function jourCourt(iso: string): string {
  const [, mois, jour] = iso.split('-');
  return `${jour}/${mois}`;
}
