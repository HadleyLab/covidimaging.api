import {HttpNotFoundError} from "../helpers/errors";
import User from "../models/user";
import TransferProviders from "../providers/transfer";
import sessionProvider from './session'
import Hospitals from '../models/hospitals'
import Transfer from "../models/transfers";
import docuSign from "../helpers/docuSign";
import fs from "fs";

import {getSignedUrlS3, uploadToS3} from "../helpers/S3";

class UserProvider {

    async byPrimaryKey(_id) {
        const user = await User.findOne({_id});
        if (!user) {
            throw new HttpNotFoundError();
        }
        return user;
    }

    async _login(body, role) {

        const user = await this.byEmail(body);

        if (!user || !user.checkPassword(body.password)) {
            return;
        }

        if (role && (!Array.isArray(user.roles) || user.roles.indexOf(role) === -1)) {
            return;
        }

        return await sessionProvider.getOrCreate(user._id);
    }

    async byID(id) {
        const user = await User.findOne({id});
        if (!user) {
            throw new HttpNotFoundError();
        }

        return user;
    }

    async create(data) {
        const user = new User(data);
        await user.save();

        return user;
    }

    async byEmail({email}) {
        return await User.findOne({email: email.toLowerCase()});
    }

    async allAvailable() {
        return await User.find({deletedAt: {$exists: false}}).count();
    }

    /**
     * If id? return one item or return all items
     *
     * @param {string} id
     *
     * @returns {Promise<*>}
     */
    async get({id, count, page}) {
        if (id) {
            return await this.byID(id);
        } else {
            return await this.getList(count, page);
        }
    }

    /**
     * Return user by ID
     *
     * @param {string} id
     *
     * @returns {Promise<*>}
     */
    async byID(id) {
        const user = await User.findOne({_id:id});
        if (!user) {
            throw new HttpNotFoundError();
        }

        return user;
    }

    /**
     * Get list users
     *
     * @returns {Promise<*>}
     */
    async getList(countForPage, page) {

        const skipRow = (countForPage) ? countForPage * (page - 1) : 0;
        const countPage = (countForPage) ? countForPage : 10;

        const users = await User.find().skip(skipRow).limit(parseInt(countPage));

        if (!users) {
            throw new HttpNotFoundError();
        } else {
          for (let i in users) {
            if (users[i] && users[i].sign && users[i].envelopeId) {
              users[i].envelopeId = await this.getS3Url(users[i].envelopeId, 'pdf');
            }
          }

        }

      const count = await User.count();

      return {
        count: count,
        users: users
      };

    }

    async getS3Url(code, type) {
      const url = getSignedUrlS3({url: code, type: type})
      return url;
    }

    /**
     * Update status
     *
     * @param {string} userId
     * @param {integer} status
     *
     * @returns {Promise<*>}
     */
    async updateStatus ({userId, status}) {
        const user = await User.findOne({_id:userId});
        if (user) {
            if (!user.adminStatus) {
                user.adminStatus = 0;
            }
            user.adminStatus = status;
            await user.save()
            return user
        }

        throw new HttpNotFoundError()
    }

  /**
   * Update status
   *
   * @param {string} userId
   * @param {integer} status
   *
   * @returns {Promise<*>}
   */
  async updateStep (userId, step) {
    const user = await User.findOne({_id:userId});
    if (user) {
      user.stepRegistration = step;
      await user.save()
      return user
    }

    throw new HttpNotFoundError()
  }


  /**
   * Update status
   *
   * @param {string} userId
   * @param {integer} status
   *
   * @returns {Promise<*>}
   */
  async signMainDoc (userId) {
    const user = await User.findOne({_id:userId});
    if (user) {
        const filePath = await docuSign.downloadSignedDoc(user, user.envelopeId)
        await uploadToS3({bucketPath: user.envelopeId, filePath: filePath});
        if (fs.existsSync(filePath)) {
          await fs.unlinkSync(filePath);
        }
      user.sign = true;
      await user.save();
      return user
    }

    throw new HttpNotFoundError()
  }

  /**
   * Return user by filter
   *
   * @param name
   * @returns {Promise<*>}
   */
  async findOneByFilter(filter) {
    return await User.findOne(filter);
  }

  async setEnvelopeId(id, envelopeId) {

    const user = await User.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          envelopeId: envelopeId,
        }
      },
      {new: true});

    return;
  }
}

export default new UserProvider();
