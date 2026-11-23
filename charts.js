import { domains } from './survey-data.js';
const point = (index, radius) => {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / domains.length;
  return [200 + Math.cos(angle) * radius, 182 + Math.sin(angle) * radius];
};
export function profileSvg(values, prefix, decorative = false) {
  const radius = 112;
  const guides = [2, 4, 6, 8, 10].map(n => `<circle cx="200" cy="182" r="${radius * n / 10}" fill="none" stroke="#e4e5df" stroke-width="1"/>`).join('');
  const spokes = domains.map((d, i) => {
    const value = values?.[d.key];
    const end = point(i, radius), tip = point(i, typeof value === 'number' ? radius * value / 10 : 0);
    const label = point(i, radius + 36);
    const labelValue = value === 'N/A' ? 'N/A' : typeof value === 'number' ? `${value} / 10` : decorative ? '' : 'Unanswered';
    return `<g data-domain="${d.key}" data-rating="${value ?? 'unanswered'}"><line x1="200" y1="182" x2="${end[0]}" y2="${end[1]}" stroke="${d.pale}" stroke-width="9" stroke-linecap="round"/>
      ${typeof value === 'number' ? `<line class="rated-spoke" data-radius="${radius * value / 10}" x1="200" y1="182" x2="${tip[0]}" y2="${tip[1]}" stroke="${d.color}" stroke-width="9" stroke-linecap="round"/><circle cx="${tip[0]}" cy="${tip[1]}" r="5.5" fill="${d.color}" stroke="#fff" stroke-width="2"/>` : ''}
      <text x="${label[0]}" y="${label[1]}" text-anchor="middle" class="chart-label"><tspan x="${label[0]}">${d.short}</tspan><tspan class="chart-rating" x="${label[0]}" dy="19">${labelValue}</tspan></text></g>`;
  }).join('');
  return `<svg class="profile-svg" viewBox="0 0 400 365" ${decorative ? 'aria-hidden="true"' : `role="img" aria-labelledby="${prefix}-title ${prefix}-desc"`}>
    <title id="${prefix}-title">${prefix === 'current' ? 'Where I am now: Current AI use' : 'Where I want to go: Future learning interests'}</title>
    <desc id="${prefix}-desc">Five independent spokes with ratings from 1 to 10. Full ratings are listed in the table below. N/A leaves a spoke unfilled.</desc>
    ${guides}${spokes}<circle cx="200" cy="182" r="5" fill="#fff" stroke="#8b968c" stroke-width="1.5"/>
  </svg>`;
}
