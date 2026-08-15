const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const distDir = join(process.cwd(), 'dist');

test('web export contains the public app routes and API documentation', () => {
  assert.ok(
    existsSync(join(distDir, 'index.html')),
    'Run npm run build:web before npm run test:functional.',
  );

  const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
  assert.match(homeHtml, /DailyMeal/);

  const apiHtml = readFileSync(join(distDir, 'api.html'), 'utf8');
  assert.match(apiHtml, /Daily Meal API/);

  const contract = JSON.parse(readFileSync(join(distDir, 'swagger/openapi.json'), 'utf8'));
  assert.equal(contract.info.title, 'Daily Meal API');
});
