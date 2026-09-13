import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpError, TimeoutError, NetworkError } from '../src/api/errors.js';
import { parseArgs, CliError } from '../src/cli/args.js';

describe('HTTP-ошибки: 4xx vs 5xx различаются', () => {
  it('4xx — ошибка запроса', () => {
    const err = new HttpError(400, 'https://example.com');
    assert.equal(err.status, 400);
    assert.match(err.message, /запроса/);
  });

  it('5xx — ошибка сервера', () => {
    const err = new HttpError(500, 'https://example.com');
    assert.equal(err.status, 500);
    assert.match(err.message, /сервера/);
  });

  it('таймаут и сеть — разные типы', () => {
    assert.ok(new TimeoutError(1) instanceof Error);
    assert.ok(new NetworkError('boom') instanceof Error);
    assert.notEqual(new TimeoutError(1).name, new NetworkError('x').name);
  });
});

describe('CLI-валидация — ошибочные сценарии', () => {
  it('требует --city', () => {
    assert.throws(() => parseArgs(['node', 'index.js']), CliError);
  });

  it('отклоняет --days вне 1–7', () => {
    assert.throws(() => parseArgs(['node', 'index.js', '--city', 'М', '--days', '0']), CliError);
    assert.throws(() => parseArgs(['node', 'index.js', '--city', 'М', '--days', '8']), CliError);
  });

  it('принимает список через запятую и --no-cache', () => {
    const opts = parseArgs([
      'node',
      'index.js',
      '--city',
      'Москва, Казань ',
      '--days',
      '2',
      '--no-cache',
    ]);
    assert.deepEqual(opts.cities, ['Москва', 'Казань']);
    assert.equal(opts.days, 2);
    assert.equal(opts.noCache, true);
  });
});
