import docuSign from '../../helpers/docuSign'
import success from '../../helpers/success'
import transferProvider from '../../providers/transfer'
import Joi from 'joi'
import { filterParams } from '../../helpers/validate'

export const getEnvelopeUrlScheme = {

}

export const getEnvelopeUrl = async (req, res, next) => {
  try {
    const params = [
      'transferId',
      'mainSign'
    ];
    const fields = filterParams(req.body, params);
    let transferBySign = null
    let Url = ''

    if (fields.mainSign) {
      Url = await docuSign.getMainSignUrl(req.user, "mainSign")
    } else {
      if (fields.transferId) {
        transferBySign = await transferProvider.findOneByFilter({_id: fields.transferId, sign: false});
      } else {
        transferBySign = await transferProvider.findOneByFilter({user: req.user._id, sign: false});
      }

      Url = await docuSign.getEnvelopeUrl(req.user, transferBySign._id)
    }


    return success(res, {url:Url})
  } catch (e) {
    return next(e)
  }
}


