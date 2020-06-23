import { Router } from 'express';

import {
    getSchema, get,
    assignTransferSchema, assignTransfer
} from '../../../controllers/admin/packages';

import { validator } from '../../../helpers/validate';

const routes = Router();

routes.get('/get/', validator(getSchema), get);
routes.post('/assign/transfer/', validator(assignTransferSchema), assignTransfer);

export default routes
