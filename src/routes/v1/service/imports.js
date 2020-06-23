import { Router } from 'express'
import { dcmImport } from '../../../controllers/service/imports'

const routes = Router()

routes.get('/dcm', dcmImport)

export default routes
