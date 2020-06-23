/**
 * GET home page
 */
import { Router } from 'express'
import v1 from './v1'

const routes = Router()
routes.use('/v1', v1)
routes.post('/ping', (req,res,next)=>res.json({success:true}))

export default routes
