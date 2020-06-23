import bodyParser from 'body-parser';
// import path from 'path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import config from './config';
import { HttpBadRequestError } from './helpers/errors';
import routes from './routes';


const app = express();
app.disable('x-powered-by');

app.use(helmet());

app.use(cors(config.cors));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Routes
app.use(config.baseRoute, routes);

//Public directory for emails img
app.use('/img', express.static(__dirname + '/emails/img'));

app.use('/public/dcm/', express.static('./public/dcm'));

// Catch 404 and forward to error handler
app.use((req, res, next) => next(new HttpBadRequestError()));

// Error handler
app.use((err, req, res, next) => {
  const {status, code, message, details} = err;
  console.error(err);
  res.status(status || 500).json({code, message, details});
});

export default app;
