import http from 'http';
import app from './app';
import logger from "./helpers/logger";

const { PORT = 8091 } = process.env;
const server = http.createServer(app);

server.listen(PORT, () => logger.info(`Listening on port ${PORT}`)); // eslint-disable-line no-console
