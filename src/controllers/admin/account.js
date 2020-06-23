import userProvider from '../../providers/user'
import sessionProvider from '../../providers/session'
import { ROLE_ADMIN } from '../../constants'
import Joi from 'joi'
import error from '../../helpers/error'
import success from '../../helpers/success'

export const loginSchema = {
  email: Joi.string().required(),
  password: Joi.string().required(),
}

export const login = async (req, res, next) => {
  try {
    const result = await userProvider._login(req.body, ROLE_ADMIN);
    if (result) {
      return success(res, result)
    }
    return next(error('login.incorrect'))
  } catch (e) {
    return next(e)
  }
}

export const logout = async (req, res, next) => {
  try {
    await sessionProvider.remove(req.user.token)
    return success(res)
  } catch (e) {
    return next(e)
  }
}
