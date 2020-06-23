import { Router } from 'express';
import { allowOnly, authOnly } from '../../../helpers/authorization';
import { ROLE_ADMIN } from '../../../constants';
import account from './account';
import dicoms from './dicoms';
import packages from './packages';
import hospitals from './hospitals';
import annotations from './annotations';
import users from './users';
import files from './files';
import transfer from './transfer';

const routes = Router()

routes.use('/account', account)

// routes.use(authOnly())
// routes.use(allowOnly(ROLE_ADMIN))

routes.use('/hospitals', hospitals)
routes.use('/annotations', annotations)
routes.use('/dicoms', dicoms)
routes.use('/files', files)
routes.use('/packages', packages)
routes.use('/users', users)
routes.use('/transfer', transfer)


export default routes
