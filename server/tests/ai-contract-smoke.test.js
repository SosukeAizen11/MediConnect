import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import app from '../src/app.js';
import * as aiFacade from '../src/modules/ai/index.js';

const collectRoutes = (layers, prefix = '') => {
  const routes = [];

  for (const layer of layers) {
    if (layer.route) {
      routes.push({
        path: prefix + layer.route.path,
        methods: Object.keys(layer.route.methods),
        handlers: layer.route.stack.map((entry) => entry.handle),
      });
    }

    if (layer.name === 'router' && layer.handle && Array.isArray(layer.handle.stack)) {
      routes.push(...collectRoutes(layer.handle.stack, prefix));
    }
  }

  return routes;
};

const hasProtectMiddleware = (handlers) =>
  handlers.some((handler) => {
    const source = Function.prototype.toString.call(handler);
    return handler.name === 'protect' || source.includes('findUserById') || source.includes('Not authorized');
  });

const hasAuthorizeMiddleware = (handlers) =>
  handlers.some((handler) => {
    const source = Function.prototype.toString.call(handler);
    return source.includes('req.user.role') || source.includes('is not authorized');
  });

const readFile = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('AI facade exposes only the intended public contract', () => {
  const exportedKeys = Object.keys(aiFacade).sort();
  assert.deepEqual(exportedKeys, ['analyzeReport', 'chatWithReceptionist']);

  assert.equal(typeof aiFacade.analyzeReport, 'function');
  assert.equal(typeof aiFacade.chatWithReceptionist, 'function');
});

test('AI insight route exists, uses POST, and enforces protect + PATIENT authorization', () => {
  const routes = collectRoutes(app._router.stack);
  const route = routes.find((entry) => entry.path === '/analyze-report/:reportId' && entry.methods.includes('post'));

  assert.ok(route, 'Expected POST /api/v1/ai-insights/analyze-report/:reportId route to exist');
  assert.deepEqual(route.methods, ['post']);
  assert.equal(hasProtectMiddleware(route.handlers), true, 'AI insight route is missing protect middleware');
  assert.equal(hasAuthorizeMiddleware(route.handlers), true, 'AI insight route is missing PATIENT authorization middleware');
});

test('AI receptionist route exists, uses POST, and requires authentication only', () => {
  const routes = collectRoutes(app._router.stack);
  const route = routes.find((entry) => entry.path === '/chat' && entry.methods.includes('post'));

  assert.ok(route, 'Expected POST /api/v1/ai-receptionist/chat route to exist');
  assert.deepEqual(route.methods, ['post']);
  assert.equal(hasProtectMiddleware(route.handlers), true, 'AI receptionist route is missing protect middleware');
  assert.equal(hasAuthorizeMiddleware(route.handlers), false, 'AI receptionist route should not require PATIENT role authorization');
});

test('AI controller imports use only facade access and not direct domain model imports', () => {
  const aiInsightControllerSource = readFile('src/modules/ai/controllers/aiInsights.controller.js');
  const aiReceptionistControllerSource = readFile('src/modules/ai/controllers/aiReceptionist.controller.js');

  assert.match(aiInsightControllerSource, /getReportForPatient/);
  assert.match(aiReceptionistControllerSource, /findDoctorById/);
  assert.match(aiReceptionistControllerSource, /bookAppointment/);

  assert.doesNotMatch(aiInsightControllerSource, /from '\.\.\/\.\.\/.*(report|user|doctor|appointment|token|consultation|clinic)\.model/);
  assert.doesNotMatch(aiReceptionistControllerSource, /from '\.\.\/\.\.\/.*(report|user|doctor|appointment|token|consultation|clinic)\.model/);
});

test('No reverse domain -> AI imports are introduced in the extracted module', () => {
  const aiFiles = [
    'src/modules/ai/index.js',
    'src/modules/ai/controllers/aiInsights.controller.js',
    'src/modules/ai/controllers/aiReceptionist.controller.js',
    'src/modules/ai/routes/aiInsights.routes.js',
    'src/modules/ai/routes/aiReceptionist.routes.js',
  ];

  for (const file of aiFiles) {
    const source = readFile(file);
    const reverseImports = [
      /from\s+['\"][^'\"]*\/ai\//,
      /from\s+['\"][^'\"]*modules\/ai\//,
      /from\s+['\"][^'\"]*\.\.\/\.\.\/ai\//,
      /from\s+['\"][^'\"]*\.\.\/ai\//,
    ];

    for (const pattern of reverseImports) {
      assert.doesNotMatch(source, pattern, `Unexpected reversed AI import in ${file}`);
    }
  }
});
