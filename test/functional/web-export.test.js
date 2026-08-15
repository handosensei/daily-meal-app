const assert = require('node:assert/strict');
const { createReadStream, existsSync, readFileSync } = require('node:fs');
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

test('web export serves the public app routes and API documentation over HTTP', async () => {
  assert.ok(
    existsSync(join(distDir, 'index.html')),
    'Run npm run build:web before npm run test:functional.',
  );

  const server = await createStaticServer();

  try {
    const homeHtml = await fetchText(server.origin, '/');
    assert.match(homeHtml, /DailyMeal/);

    const apiHtml = await fetchText(server.origin, '/api');
    assert.match(apiHtml, /Daily Meal API/);

    const contractResponse = await fetch(`${server.origin}/swagger/openapi.json`);
    assert.equal(contractResponse.status, 200);
    assert.match(contractResponse.headers.get('content-type'), /application\/json/);

    const contract = await contractResponse.json();
    assert.equal(contract.info.title, 'Daily Meal API');
  } finally {
    await server.close();
  }
});

test('web export keeps the published OpenAPI contract aligned with the source contract', () => {
  const sourceContract = JSON.parse(readFileSync(join(process.cwd(), 'public/swagger/openapi.json'), 'utf8'));
  const exportedContract = JSON.parse(readFileSync(join(distDir, 'swagger/openapi.json'), 'utf8'));

  assert.deepEqual(exportedContract, sourceContract);
});
