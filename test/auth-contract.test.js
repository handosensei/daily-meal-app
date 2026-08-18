const { readFileSync } = require('node:fs');

const contract = JSON.parse(readFileSync('public/swagger/openapi.json', 'utf8'));

test('OpenAPI contract documents password login for the frontend', () => {
  const endpoint = contract.paths['/auth/login'].post;
  const requestSchemaRef = endpoint.requestBody.content['application/json'].schema.$ref;
  const responseSchemaRef = endpoint.responses['200'].content['application/json'].schema.$ref;
  const invalidCredentials = endpoint.responses['401'].content['application/json'].example;

  expect(endpoint.operationId).toBe('AuthController_login');
  expect(requestSchemaRef).toBe('#/components/schemas/LoginRequestDto');
  expect(responseSchemaRef).toBe('#/components/schemas/LoginResponseDto');
  expect(invalidCredentials.message).toBe('Invalid email or password');
});

test('OpenAPI contract documents Google ID token login for the frontend', () => {
  const endpoint = contract.paths['/auth/google'].post;
  const requestSchemaRef = endpoint.requestBody.content['application/json'].schema.$ref;
  const requestSchema = contract.components.schemas.GoogleLoginRequestDto;
  const responseSchemaRef = endpoint.responses['200'].content['application/json'].schema.$ref;

  expect(endpoint.operationId).toBe('AuthController_loginWithGoogle');
  expect(requestSchemaRef).toBe('#/components/schemas/GoogleLoginRequestDto');
  expect(requestSchema.required).toEqual(['idToken']);
  expect(responseSchemaRef).toBe('#/components/schemas/LoginResponseDto');
});

test('OpenAPI contract documents user registration for the frontend', () => {
  const endpoint = contract.paths['/users'].post;
  const requestSchemaRef = endpoint.requestBody.content['application/json'].schema.$ref;
  const requestSchema = contract.components.schemas.CreateUserRequestDto;
  const responseSchemaRef = endpoint.responses['201'].content['application/json'].schema.$ref;
  const duplicateEmail = endpoint.responses['409'].content['application/json'].example;

  expect(endpoint.operationId).toBe('UsersController_create');
  expect(requestSchemaRef).toBe('#/components/schemas/CreateUserRequestDto');
  expect(requestSchema.required).toEqual([
    'lastname',
    'firstname',
    'email',
    'password',
    'passwordConfirmation',
  ]);
  expect(requestSchema.properties.password.minLength).toBe(8);
  expect(responseSchemaRef).toBe('#/components/schemas/PublicUserDto');
  expect(duplicateEmail.message).toBe('A user with this email already exists');
});
