import { Router } from 'express'

import { tokenAuthorization } from '../../helpers/authorization'

import admin from './admin';
import patient from './patient';
import service from './service';

const routes = Router()

routes.use(tokenAuthorization())
routes.use('/admin', admin)
routes.use('/patient', patient)
routes.use('/service', service)

export default routes
