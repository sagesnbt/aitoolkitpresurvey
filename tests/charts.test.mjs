import test from 'node:test';
import assert from 'node:assert/strict';
import { profileSvg } from '../charts.js';
import { domains } from '../survey-data.js';

function attributes(markup) {
  return Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
}

function spokes(svg) {
  return [...svg.matchAll(/<g\b([^>]*)>([\s\S]*?)<\/g>/g)].map(([, opening, content]) => {
    const lines = [...content.matchAll(/<line\b([^>]*)\/>/g)].map(([, attrs]) => attributes(attrs));
    return {
      ...attributes(opening), content,
      track: lines.find(line => line.class !== 'rated-spoke'),
      rating: lines.find(line => line.class === 'rated-spoke'),
    };
  });
}

function values(rating) {
  return Object.fromEntries(domains.map(domain => [domain.key, rating]));
}

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, received ${actual}`);
}

test('ratings 1, 5, and 10 map to one tenth, one half, and full 112-unit spoke radii', () => {
  for (const rating of [1, 5, 10]) {
    const rendered = spokes(profileSvg(values(rating), 'current'));
    assert.equal(rendered.length, 5);
    rendered.forEach((spoke, index) => {
      const segment = spoke.rating;
      assert.ok(segment, `rating ${rating} has a colored segment in every domain`);
      const expectedRadius = rating / 10 * 112;
      close(Number(segment['data-radius']), expectedRadius, 'declared radius');
      close(Math.hypot(Number(segment.x2) - Number(segment.x1), Number(segment.y2) - Number(segment.y1)), expectedRadius, 'rendered segment length');
      close(Number(segment.x1), Number(spoke.track.x1), 'common center x');
      close(Number(segment.y1), Number(spoke.track.y1), 'common center y');
      close(Number(segment.x2) - Number(segment.x1), (Number(spoke.track.x2) - Number(spoke.track.x1)) * rating / 10, 'segment follows its track x');
      close(Number(segment.y2) - Number(segment.y1), (Number(spoke.track.y2) - Number(spoke.track.y1)) * rating / 10, 'segment follows its track y');
      assert.equal(segment.stroke, domains[index].color);
      assert.equal(spoke['data-rating'], String(rating));
      assert.ok(spoke.content.includes(`${rating} / 10`));
    });
  }
});

test('all five spokes share a center, full-length tracks, and equal angular spacing', () => {
  const rendered = spokes(profileSvg(values(5), 'current'));
  const centerX = Number(rendered[0].track.x1);
  const centerY = Number(rendered[0].track.y1);
  const angles = rendered.map(spoke => {
    close(Number(spoke.track.x1), centerX, 'track center x');
    close(Number(spoke.track.y1), centerY, 'track center y');
    const dx = Number(spoke.track.x2) - centerX;
    const dy = Number(spoke.track.y2) - centerY;
    close(Math.hypot(dx, dy), 112, 'full-length faint track');
    return Math.atan2(dy, dx);
  });
  for (let index = 0; index < angles.length; index++) {
    const next = (index + 1) % angles.length;
    const gap = (angles[next] - angles[index] + Math.PI * 2) % (Math.PI * 2);
    close(gap, Math.PI * 2 / 5, 'equal angular separation');
  }
});

test('current and future use the same domain order, colors, and track orientation with independent ratings', () => {
  const currentValues = Object.fromEntries(domains.map((domain, index) => [domain.key, index + 1]));
  const futureValues = Object.fromEntries(domains.map((domain, index) => [domain.key, 10 - index]));
  const originalCurrent = structuredClone(currentValues);
  const originalFuture = structuredClone(futureValues);
  const current = spokes(profileSvg(currentValues, 'current'));
  const future = spokes(profileSvg(futureValues, 'future'));
  assert.deepEqual(current.map(spoke => spoke['data-domain']), domains.map(domain => domain.key));
  assert.deepEqual(future.map(spoke => spoke['data-domain']), domains.map(domain => domain.key));
  current.forEach((spoke, index) => {
    assert.deepEqual(spoke.track, future[index].track);
    assert.equal(spoke.rating.stroke, future[index].rating.stroke);
    assert.equal(spoke.rating.stroke, domains[index].color);
    close(Number(spoke.rating['data-radius']), (index + 1) / 10 * 112, 'current radius');
    close(Number(future[index].rating['data-radius']), (10 - index) / 10 * 112, 'future radius');
  });
  assert.deepEqual(currentValues, originalCurrent);
  assert.deepEqual(futureValues, originalFuture);
});

test('N/A preserves a faint full-length track and explicit label without a zero-valued colored segment', () => {
  const input = values(5);
  input.surgical_intraoperative = 'N/A';
  const rendered = spokes(profileSvg(input, 'current'));
  const na = rendered.find(spoke => spoke['data-domain'] === 'surgical_intraoperative');
  assert.equal(na['data-rating'], 'N/A');
  assert.ok(na.track);
  assert.equal(na.rating, undefined);
  assert.equal(na.content.includes('data-radius'), false);
  assert.equal(na.content.includes('>0 / 10<'), false);
  assert.ok(na.content.includes('>N/A<'));
  assert.equal(rendered.filter(spoke => spoke.rating).length, 4);
});

test('unanswered domains are explicitly unanswered and never rendered as recorded zero ratings', () => {
  for (const input of [null, {}, values(null)]) {
    const rendered = spokes(profileSvg(input, 'current'));
    assert.equal(rendered.length, 5);
    for (const spoke of rendered) {
      assert.equal(spoke['data-rating'], 'unanswered');
      assert.equal(spoke.rating, undefined);
      assert.ok(spoke.content.includes('>Unanswered<'));
      assert.equal(spoke.content.includes('data-radius'), false);
      assert.equal(spoke.content.includes('>0 / 10<'), false);
    }
  }
});

test('profiles expose human-readable labels and separately referenced accessible titles and descriptions', () => {
  for (const [prefix, expectedTitle] of [
    ['current', 'Where I am now: Current AI use'],
    ['future', 'Where I want to go: Future learning interests']
  ]) {
    const svg = profileSvg(values(5), prefix);
    const root = attributes(svg.match(/<svg\b([^>]*)>/)[1]);
    assert.equal(root.role, 'img');
    assert.equal(root['aria-labelledby'], `${prefix}-title ${prefix}-desc`);
    assert.ok(svg.includes(`<title id="${prefix}-title">${expectedTitle}</title>`));
    assert.match(svg, new RegExp(`<desc id="${prefix}-desc">[^<]*Five independent spokes[^<]*1 to 10[^<]*table below[^<]*N/A[^<]*</desc>`));
    for (const domain of domains) assert.ok(svg.includes(`>${domain.short}</tspan>`));
    assert.equal([...svg.matchAll(/<circle\b[^>]*fill="none"/g)].length, 5, 'subtle circular guide levels are present');
  }
});

test('decorative welcome profile is hidden from assistive technology', () => {
  const svg = profileSvg(null, 'welcome', true);
  const root = attributes(svg.match(/<svg\b([^>]*)>/)[1]);
  assert.equal(root['aria-hidden'], 'true');
  assert.equal(root.role, undefined);
  assert.equal(root['aria-labelledby'], undefined);
});
