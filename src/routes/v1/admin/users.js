import { Router } from 'express';

import {
    updateStatusSchema, updateStatus,
    getSchema, get,
} from '../../../controllers/admin/users';

import { validator } from '../../../helpers/validate';

const routes = Router();

routes.post('/update/status', validator(updateStatusSchema), updateStatus);
routes.get('/get/:id*?', validator(getSchema), get);




export default routes
