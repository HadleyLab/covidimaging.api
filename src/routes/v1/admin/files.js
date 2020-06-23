import { Router } from 'express'
import {saveSchema, save, getSchema, getDataFileDicomId} from '../../../controllers/patient/files'
import { authOnly } from '../../../helpers/authorization'
import { validator } from '../../../helpers/validate'

const routes = Router()

routes.use(authOnly())

routes.post('/save', validator(saveSchema), save)
routes.post('/get', validator(getSchema), getDataFileDicomId)

export default routes
