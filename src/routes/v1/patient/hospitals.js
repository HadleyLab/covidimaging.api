import { Router } from 'express';
import {
    getSchema, get,
    findSchema, find,
    createSchema, create,

} from '../../../controllers/admin/hospitals';
import { validator } from '../../../helpers/validate';

const routes = Router();

routes.get('/get/:id*?', validator(getSchema), get);
routes.post('/find/', validator(findSchema), find);
routes.post('/add/', validator(createSchema), create);

export default routes
