import { Router } from 'express';

import {
    createSchema, create,
    delSchema, del,
    updateSchema, update,
    getSchema, get,
} from '../../../controllers/admin/annotations';

import { validator } from '../../../helpers/validate';

const routes = Router();

routes.post('/add', validator(createSchema), create);
routes.post('/update', validator(updateSchema), update);
routes.post('/del', validator(delSchema), del);
routes.get('/get/:id*?', validator(getSchema), get);




export default routes
