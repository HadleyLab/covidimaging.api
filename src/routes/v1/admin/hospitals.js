import { Router } from 'express';

import {
  createSchema, create,
  delSchema, del,
  updateSchema, update,
  getSchema, get,
  getEditSchema, edit,
  findSchema, find,
  redefinitionSchema, redefinition
} from '../../../controllers/admin/hospitals';

import { validator } from '../../../helpers/validate';

const routes = Router();

routes.post('/add', validator(createSchema), create);
routes.post('/update', validator(updateSchema), update);
routes.post('/del', validator(delSchema), del);
routes.get('/get/:id*?', validator(getSchema), get);
routes.get('/edit/get/:hash*?', validator(getEditSchema), edit);
routes.post('/find/', validator(findSchema), find);
routes.post('/redefinition', validator(redefinitionSchema), redefinition);



export default routes
