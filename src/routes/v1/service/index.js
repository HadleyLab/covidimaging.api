import { Router } from 'express'


import imports from './imports'


const routes = Router()

routes.use('/import', imports)

export default routes
