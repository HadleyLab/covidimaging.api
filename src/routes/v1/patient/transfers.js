import { Router } from 'express';

import {
    getSchema, get,
  createSchema, create
} from '../../../controllers/patient/transfers';

import { validator } from '../../../helpers/validate';
import { allowOnly, authOnly } from '../../../helpers/authorization';

const routes = Router();

routes.post('/create', validator(createSchema), create);

routes.use(authOnly());
routes.get('/get/', validator(getSchema), get);


export default routes
