import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
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

// Swagger UI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
