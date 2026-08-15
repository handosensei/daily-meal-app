const { readFileSync } = require('node:fs');

const contract = JSON.parse(readFileSync('public/swagger/openapi.json', 'utf8'));

test('OpenAPI contract exposes the required Swagger metadata', () => {
  expect(contract.openapi).toBe('3.0.0');
  expect(contract.info.title).toBe('Daily Meal API');
  expect(contract.info.version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(Array.isArray(contract.servers)).toBe(true);
  expect(typeof contract.paths).toBe('object');
  expect(contract.paths['/groups'].post.responses['201'].description).toBe(
    'Creates a group for the authenticated user.',
  );
});

test('OpenAPI contract defines reusable frontend error schema', () => {
  const apiError = contract.components.schemas.ErrorResponseDto;

  expect(apiError.required).toEqual(['statusCode', 'message', 'error']);
  expect(apiError.properties.statusCode.example).toBe(400);
  expect(contract.components.securitySchemes.bearer.scheme).toBe('bearer');
});
