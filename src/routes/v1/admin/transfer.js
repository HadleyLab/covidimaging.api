import { Router } from 'express';

import {
    updateStatusSchema, updateStatus,
    getSchema, get,
} from '../../../controllers/admin/transfer';

import { validator } from '../../../helpers/validate';

const routes = Router();

routes.get('/get/:id*?', validator(getSchema), get);
routes.post('/status', validator(updateStatusSchema), updateStatus);



export default routes
