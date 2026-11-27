import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { env } from './config/env';
import { notFound, errorHandler } from './middlewares/errorHandler';
import { paymentController } from './modules/payments/payment.controller';
import swaggerSpec from './config/swagger';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Webhook requires raw body before express.json
app.post(
  '/api/payments/confirm',
  express.raw({ type: 'application/json' }),
  paymentController.confirm,
);

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Karigor API is running',
    docs: '/api/docs',
    health: '/api/health',
  });
});

// Swagger UI Documentation (CDN assets for Vercel serverless compatibility)
app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.get(['/api/docs', '/api/docs/'], (_req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://unpkg.com;",
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Karigor API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: '/api/docs.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout'
      });
    };
  </script>
</body>
</html>`);
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
