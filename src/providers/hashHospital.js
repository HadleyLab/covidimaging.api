import HashHospital from "../models/hashHospital";
import TransferProvider from "../providers/transfer"
import { HttpNotFoundError } from '../helpers/errors'

/**
 *
 */
class hashHospitalProvider {

    /**
     * Found and remove by _id
     *
     * @param {string} id =_id
     *
     * @returns {Promise<*>}
     */
    async delete(id) {
        let result = HashHospital.findOne({_id:id}).remove();
        if (!result) {
            throw new HttpNotFoundError();
        }

        return result;
    }

    /**
     * Return Hospitals by ID
     *
     * @param id
     * @returns {Promise<*>}
     */
    async byID(id) {
        const hash = await HashHospital.findOne({_id:id}).populate('contactPerson');
        if (!hash) {
            throw new HttpNotFoundError();
        }
        return hash;
    }

  /**
   * Send email hospitals contacts and remove hash Hospitals edit
   *
   * @param hospitalId
   * @returns {Promise<void>}
   */
    async signTransferByHospitalId(hospitalId){
        const hashHospital = await HashHospital.find({hospital:hospitalId});
        if (hashHospital) {
          for (let key in hashHospital) {
            await TransferProvider.signTransfer(hashHospital[key].transfer, false)
            await hashHospital[key].remove();
          }
        }
    }
}

export default new hashHospitalProvider();
