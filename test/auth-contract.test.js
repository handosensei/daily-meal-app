const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const contract = JSON.parse(readFileSync('public/swagger/openapi.json', 'utf8'));

test('OpenAPI contract documents password login for the frontend', () => {
  const endpoint = contract.paths['/auth/login'].post;
  const requestSchemaRef = endpoint.requestBody.content['application/json'].schema.$ref;
  const responseSchemaRef = endpoint.responses['200'].content['application/json'].schema.$ref;
  const invalidCredentials = endpoint.responses['401'].content['application/json'].example;

  assert.equal(endpoint.operationId, 'AuthController_login');
  assert.equal(requestSchemaRef, '#/components/schemas/LoginRequestDto');
  assert.equal(responseSchemaRef, '#/components/schemas/LoginResponseDto');
  assert.equal(invalidCredentials.message, 'Invalid email or password');
});

test('OpenAPI contract documents Google ID token login for the frontend', () => {
  const endpoint = contract.paths['/auth/google'].post;
  const requestSchemaRef = endpoint.requestBody.content['application/json'].schema.$ref;
  const requestSchema = contract.components.schemas.GoogleLoginRequestDto;
  const responseSchemaRef = endpoint.responses['200'].content['application/json'].schema.$ref;

  assert.equal(endpoint.operationId, 'AuthController_loginWithGoogle');
  assert.equal(requestSchemaRef, '#/components/schemas/GoogleLoginRequestDto');
  assert.deepEqual(requestSchema.required, ['idToken']);
  assert.equal(responseSchemaRef, '#/components/schemas/LoginResponseDto');
});
