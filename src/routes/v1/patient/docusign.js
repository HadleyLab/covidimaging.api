import { Router } from 'express'

import { getEnvelopeUrl , getEnvelopeUrlScheme} from '../../../controllers/patient/docusign'
import { validator } from '../../../helpers/validate'
const routes = Router()
routes.post('/send', validator(getEnvelopeUrlScheme), getEnvelopeUrl)
export default routes
