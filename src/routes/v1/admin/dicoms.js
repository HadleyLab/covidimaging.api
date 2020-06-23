import { Router } from 'express';

import {
    getSchema, get
} from '../../../controllers/admin/dicoms';

import { validator } from '../../../helpers/validate';

const routes = Router();

routes.get('/get/', validator(getSchema), get);

export default routes
