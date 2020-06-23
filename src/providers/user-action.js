import { HttpNotFoundError } from '../helpers/errors'
import UserAction from '../models/user-action'
import {
  CONFIRM_EMAIL_COUNT_LIMIT,
  CONFIRM_EMAIL_HOURS_LIMIT,
  RESET_PASSWORD_COUNT_LIMIT,
  RESET_PASSWORD_HOURS_LIMIT,
  USER_ACTION_CONFIRM_EMAIL,
  USER_ACTION_CONFIRM_EMAIL_ATTEMPT,
  USER_ACTION_RESET_PASSWORD,
} from '../constants'
import crypto from 'crypto'

const CODE_LENGTH = 96

class UserActionProvider {

  async generateResetActionRecord (user) {
    const hoursLimit = RESET_PASSWORD_HOURS_LIMIT || 1

    await UserAction.deleteMany({
      user,
      actionType: USER_ACTION_RESET_PASSWORD,
      createdAt: {
        $lt: new Date(Date.now() - hoursLimit * 60 * 60 * 1000),
      },
    })

    const isLimitReached = await this.checkActionLimit(
      user,
      USER_ACTION_RESET_PASSWORD,
      RESET_PASSWORD_HOURS_LIMIT,
      RESET_PASSWORD_COUNT_LIMIT,
    )

    if (!isLimitReached) {
      return {error: true}
    }

    return await this._generateAction(user, USER_ACTION_RESET_PASSWORD)
  }

  async checkActionLimit (user, actionType, hoursLimit = 1, countLimit = 3) {
    let count = await UserAction.countDocuments({
      actionType: actionType,
      user,
      createdAt: {
        $gt: new Date(Date.now() - hoursLimit * 60 * 60 * 1000),
      },
    })
    return (count < countLimit)
  }

  async updateUserPassword ({id, data, password}) {
    const userAction = await UserAction.findOne({_id: id}).populate('user')
    if (userAction && userAction.data.hash === data &&
      parseInt(userAction.actionType) === USER_ACTION_RESET_PASSWORD) {
      if (password) {
        const user = await userAction.user[0]
        user.password = password
        await user.save()
        userAction.remove()
      }
      return true
    }
    throw new HttpNotFoundError()
  }

  async generateConfirmEmailActionRecord (user) {
    let action = await UserAction.findOne({user, actionType: USER_ACTION_CONFIRM_EMAIL})

    if (!action) {
      action = await this._generateAction(user, USER_ACTION_CONFIRM_EMAIL)
    }
    return action
  }

  async _generateAction (user, actionType, data) {
    const userAction = new UserAction({
      user,
      data: data ||
      {hash: await crypto.randomBytes(CODE_LENGTH).toString('hex')},
      actionType,
    })
    await userAction.save()
    return userAction
  }

  async confirmEmail ({id, data}) {
    const userAction = await UserAction.findOne({_id: id}).populate('user')
    if (userAction && userAction.data && userAction.data.hash === data &&
      parseInt(userAction.actionType) === USER_ACTION_CONFIRM_EMAIL) {
      const user = userAction.user[0]
      if (!user.confirmed) {
        user.confirmed = {}
      }
      user.confirmed.email = true
      await user.save()
      // await userAction.remove();
      return user
    } else {
      throw new HttpNotFoundError()
    }
  }

  async checkConfirmActionLimit (user) {
    const hoursLimit = RESET_PASSWORD_HOURS_LIMIT || 1

    await UserAction.deleteMany({
      user,
      actionType: USER_ACTION_CONFIRM_EMAIL_ATTEMPT,
      createdAt: {
        $lt: new Date(Date.now() - hoursLimit * 60 * 60 * 1000),
      },
    })

    const isLimitReached = await this.checkActionLimit(
      user,
      USER_ACTION_CONFIRM_EMAIL_ATTEMPT,
      CONFIRM_EMAIL_HOURS_LIMIT,
      CONFIRM_EMAIL_COUNT_LIMIT,
    )

    if (isLimitReached) {
      return true
    }

    await this._generateAction(user, USER_ACTION_CONFIRM_EMAIL_ATTEMPT)
    return false
  }
}

export default new UserActionProvider()
