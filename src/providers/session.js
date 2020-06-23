import {HttpNotFoundError} from '../helpers/errors';
import Session from '../models/session';
import {getSignedUrlS3} from "../helpers/S3";

class SessionProvider {
  async byToken(token) {
    const session = await Session.findOne({token}).populate('user');
    if (!session) {
      throw new HttpNotFoundError();
    }
    return this.getFormatted(session);
  }
  getFormatted(session){
    return{
      user:session.user,
      token:session.token
    }
  }

  async getS3Url(code, type) {
    const url = getSignedUrlS3({url: code, type: type})
    return url;
  }

  async getOrCreate(userId){
    const session = await Session.findOne({user:userId}).populate('user')
    let result = {};
    if (session) {
      result = this.getFormatted(session)
    } else {
      result = await this.create(userId);
    }

    if (result.user && result.user.sign && result.user.envelopeId) {
      result.user.envelopeId = await this.getS3Url(result.user.envelopeId, 'pdf');
    }

    return result;
  }
  create(user) {
    return new Promise(async (resolve, reject) => {
      const session = new Session({user});
      await session.save();
      session.populate('user', (err,ses) => {
        resolve(this.getFormatted(ses));
      });
    });
  }

  async remove(token) {
    return await Session.remove({token});
  }
}

export default new SessionProvider();
