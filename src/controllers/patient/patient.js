import { OK } from 'http-status'
import userProvider from '../../providers/user'
import hospitalProvider from '../../providers/hospitals'
import userActionProvider from '../../providers/user-action'
import sessionProvider from '../../providers/session'
import transferProvider from '../../providers/transfer'
import { HttpUnprocessableEntityError } from '../../helpers/errors'
import { PASSWORD_MIN_LENGTH, REGISTRATION_THIRD_STEP, ROLE_PATIENT } from '../../constants'
import mail from '../../helpers/mail'
import config from '../../config'
import {REGISTRATION_SECOND_STEP} from '../../constants'
import Joi from 'joi'
import logger from '../../helpers/logger'
import { filterParams } from '../../helpers/validate'
import error from '../../helpers/error'
import success from '../../helpers/success'
import translationHelper from '../../helpers/translationHelper';

export const getUser = async (req, res, next) => {
  try {
    const session = await sessionProvider.byToken(req.body.token)
    if (session) {
      return res.status(OK).json({
        user: {
          token: session.token, ...session.user.toJSON(),
        },
      })
    }
    return next(new HttpUnprocessableEntityError())
  } catch (e) {
    return next(e)
  }
}

export const createSchema = {
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  dob: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(PASSWORD_MIN_LENGTH),
  passwordConfirm: Joi.string().required().valid(Joi.ref('password')),
}
export const create = async (req, res, next) => {
  const userAccountFields = [
    'firstName', 'lastName', 'email','password', 'dob', 'phone'
  ]

  try {
    const fields = filterParams(req.body, userAccountFields)
    fields.roles = [ROLE_PATIENT]

    const user = await userProvider.create(fields)
    const action = await userActionProvider.generateConfirmEmailActionRecord(user._id)

    await mail.sendRegistrationEmail({
      url: `${config.url}confirm/${action._id}/${action.data && action.data.hash}`,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      subjectTitle: 'CovidImaging email confirmation'
    })

    const result = await userProvider._login(fields, ROLE_PATIENT)
    logger.info(result)
    return res.status(OK).json(result)
  } catch (e) {
    return next(e)
  }
}

export const loginSchema = {
  email: Joi.string().required(),
  password: Joi.string().required(),
}
export const login = async (req, res, next) => {
  try {
    const result = await userProvider._login(req.body, ROLE_PATIENT)
    if (result) {
      return success(res, result)
    }
    return next(error('login.incorrect'))
  } catch (e) {
    return next(e)
  }
}

export const updateStepSchema = {
  userId: Joi.string().min(24).max(24),
}
export const updateStep = async (req, res, next) => {
  try {
    let user = {}
    if (req.body.transferId) {
      user = await userProvider.updateStep(req.body.userId, REGISTRATION_THIRD_STEP)
      await transferProvider.signTransfer(req.body.transferId, true)
    } else if(req.body.mainDoc){
      user = await userProvider.signMainDoc(req.body.userId)
    } else {
      return next(new HttpUnprocessableEntityError())
    }

    const result =  await sessionProvider.getOrCreate(user._id);

    if (result) {
      return success(res, result)
    }

    return next(new HttpUnprocessableEntityError())
  } catch (e) {
    return next(e)
  }
}

export const resetSchema = {
  password: Joi.string().allow('').min(6),
  id: Joi.string().required(),
  data: Joi.string().required(),
}
export const reset = async (req, res, next) => {
  try {
    await userActionProvider.updateUserPassword(Object.assign({}, req.params, req.body))
    return success(res, {step: 2})
  } catch (e) {
    return next(e)
  }
}

export const resetRequestSchema = {
  email: Joi.string().required().email(),
}
export const resetRequest = async (req, res, next) => {
  try {
    const user = await userProvider.byEmail(req.body)
    if (user) {
      const action = await userActionProvider.generateResetActionRecord(user._id)
      if (action.error) {
        return success(res, {step: 0})
      }
      mail.sendResetPasswordEmail({
        url: config.url + '/resetpwd/' + action._id + '/' + action.data.hash,
        email: user.email,
      })
      return success(res, {code: 1})
    }
    return next(new HttpUnprocessableEntityError())
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

export const confirmSchema = {
  id: Joi.string().required(),
  data: Joi.string().required(),
}
export const confirm = async (req, res, next) => {
  try {
    const user = await userActionProvider.confirmEmail(req.body)
    const result =  await sessionProvider.getOrCreate(user._id);
    if (result) {
      return success(res, result)
    }
    return next(new HttpUnprocessableEntityError())
    return success(res)
  } catch (e) {
    return next(e)
  }
}

export const resend = async (req, res, next) => {
  try {
    console.log(req.user);
    const user = (req.user) ? req.user : false;
    if (user) {
      const action = await userActionProvider.generateConfirmEmailActionRecord(user._id)
      await mail.sendRegistrationEmail({
        url: `${config.url}confirm/${action._id}/${action.data && action.data.hash}`,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        subjectTitle: 'Registration'
      })
    } else {
      return next(new HttpUnprocessableEntityError())
    }


    return success(res)
  } catch (e) {
    return next(e)
  }
}
