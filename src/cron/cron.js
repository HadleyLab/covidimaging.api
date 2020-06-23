import importDCM from '../providers/import-pack'
import cron from 'node-cron';
import logger from "../helpers/logger";
try {
  cron.schedule('*/2 * * * *', async () => {
    await importDCM.run();
  }, true);
} catch (e) {
  logger.info(e);
  process.exit();
}
