const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const contract = JSON.parse(readFileSync('public/swagger/openapi.json', 'utf8'));

test('OpenAPI contract exposes the required Swagger metadata', () => {
  assert.equal(contract.openapi, '3.1.0');
  assert.equal(contract.info.title, 'Daily Meal API');
  assert.match(contract.info.version, /^\d+\.\d+\.\d+$/);
  assert.ok(Array.isArray(contract.servers));
  assert.ok(contract.servers.length > 0);
  assert.equal(typeof contract.paths, 'object');
});

test('OpenAPI contract defines reusable frontend error schema', () => {
  const apiError = contract.components.schemas.ApiError;

  assert.deepEqual(apiError.required, ['code', 'message']);
  assert.equal(apiError.additionalProperties, false);
  assert.equal(
    contract.components.securitySchemes.bearerAuth.scheme,
    'bearer',
  );
});
