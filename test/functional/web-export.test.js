const assert = require('node:assert/strict');
const { createReadStream, existsSync } = require('node:fs');
const { stat } = require('node:fs/promises');
const { createServer } = require('node:http');
const { extname, join, normalize, relative } = require('node:path');
const test = require('node:test');

const distDir = join(process.cwd(), 'dist');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

async function resolveStaticPath(requestUrl) {
  const { pathname } = new URL(requestUrl, 'http://localhost');
  const routePath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const normalizedPath = normalize(routePath).replace(/^(\.\.[/\\])+/, '');
  const candidatePath = join(distDir, normalizedPath);
  const relativePath = relative(distDir, candidatePath);

  if (relativePath.startsWith('..')) {
    return null;
  }

  try {
    if ((await stat(candidatePath)).isFile()) {
      return candidatePath;
    }
  } catch {
    const extensionlessPath = `${candidatePath}.html`;

    try {
      if ((await stat(extensionlessPath)).isFile()) {
        return extensionlessPath;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function createStaticServer() {
  const server = createServer(async (request, response) => {
    const filePath = await resolveStaticPath(request.url);

    if (!filePath) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();

      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((closeResolve) => server.close(closeResolve)),
      });
    });
  });
}

async function fetchText(origin, pathname) {
  const response = await fetch(`${origin}${pathname}`);

  assert.equal(response.status, 200);
  return response.text();
}

test('web export serves the public app routes over HTTP', async () => {
  assert.ok(
    existsSync(join(distDir, 'index.html')),
    'Run npm run build:web before npm run test:functional.',
  );

  const server = await createStaticServer();

  try {
    const loginHtml = await fetchText(server.origin, '/login');
    assert.match(loginHtml, /DailyMeal/);

    const signupHtml = await fetchText(server.origin, '/signup');
    assert.match(signupHtml, /Créer un compte/);

    const groupsHtml = await fetchText(server.origin, '/groups');
    assert.match(groupsHtml, /Mes groupes/);
  } finally {
    await server.close();
  }
});
