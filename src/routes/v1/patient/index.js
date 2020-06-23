import { Router } from 'express'
import patient from './account'
import files from './files'
import transfers from './transfers'
import annotations from './annotations'
import hospitals from './hospitals'
import docusign from './docusign'
import { onlyFullRegistration, authOnly } from '../../../helpers/authorization';
import { ROLE_PATIENT } from '../../../constants';

const routes = Router()

routes.use('/account', patient)
routes.use('/transfers', transfers)
routes.use('/annotations', annotations)
routes.use('/hospitals', hospitals)
routes.use('/docusign', docusign)

routes.use(authOnly())
routes.use(onlyFullRegistration(ROLE_PATIENT))

routes.use('/files', files)





export default routes
