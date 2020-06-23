import { Router } from 'express'

import {
  confirm,
  confirmSchema,
  create,
  createSchema,
  getUser,
  login,
  loginSchema,
  logout,
  reset,
  resetRequest,
  resetRequestSchema,
  resetSchema,
  updateStepSchema,
  updateStep,
  resend
} from '../../../controllers/patient/patient'
import { validateUnique, validator } from '../../../helpers/validate'
import { allowOnly, authOnly } from '../../../helpers/authorization'
import { ROLE_PATIENT } from '../../../constants'
import User from '../../../models/user'

const routes = Router()

routes.get('/get', getUser)
routes.post('/create', validator(createSchema), validateUnique(User, 'email'), create)
routes.post('/login', validator(loginSchema), login)
routes.post('/confirm', validator(confirmSchema), confirm)
routes.post('/updatestep', validator(updateStepSchema), updateStep)
routes.post('/resend',  resend)

routes.post('/reset/password', validator(resetRequestSchema), resetRequest)
routes.post('/reset', validator(resetSchema), reset)

routes.use(authOnly())
routes.use(allowOnly(ROLE_PATIENT))
routes.post('/logout', logout)
export default routes
