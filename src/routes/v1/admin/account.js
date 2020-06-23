import { Router } from 'express'

import {
    login,
    loginSchema,
    logout,
} from '../../../controllers/admin/account'

import { validator } from '../../../helpers/validate'
import { allowOnly, authOnly } from '../../../helpers/authorization'
import { ROLE_ADMIN } from '../../../constants'

const routes = Router()

routes.post('/login', validator(loginSchema), login)


routes.use(authOnly())
routes.use(allowOnly(ROLE_ADMIN))
routes.post('/logout', logout)
export default routes
