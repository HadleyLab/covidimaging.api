import { Router } from 'express';

import {
    getSchema, get,
} from '../../../controllers/admin/annotations';

import { validator } from '../../../helpers/validate';

const routes = Router();

routes.get('/get/:id*?', validator(getSchema), get);




export default routes
