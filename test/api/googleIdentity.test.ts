test('native Google identity rejects because sign-in is web-only in this build', async () => {
  const { requestGoogleIdToken } = require('@/api/googleIdentity');

  await expect(requestGoogleIdToken()).rejects.toThrow(
    'Google sign in is only available on web in this build',
  );
});
