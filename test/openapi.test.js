const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const contract = JSON.parse(readFileSync('public/swagger/openapi.json', 'utf8'));

test('OpenAPI contract exposes the required Swagger metadata', () => {
  assert.equal(contract.openapi, '3.0.0');
  assert.equal(contract.info.title, 'Daily Meal API');
  assert.match(contract.info.version, /^\d+\.\d+\.\d+$/);
  assert.ok(Array.isArray(contract.servers));
  assert.equal(typeof contract.paths, 'object');
  assert.equal(
    contract.paths['/groups'].post.responses['201'].description,
    'Creates a group for the authenticated user.',
  );
});

test('OpenAPI contract defines reusable frontend error schema', () => {
  const apiError = contract.components.schemas.ErrorResponseDto;

  assert.deepEqual(apiError.required, ['statusCode', 'message', 'error']);
  assert.equal(apiError.properties.statusCode.example, 400);
  assert.equal(
    contract.components.securitySchemes.bearer.scheme,
    'bearer',
  );
});
