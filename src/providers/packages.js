import {HttpNotFoundError} from "../helpers/errors";
import Packages from "../models/package";
import TransferProvider from './transfer'
import {getSignedUrlS3} from "../helpers/S3";

/**
 * Dicoms Provider
 */
class PackagesProvider {

    constructor () {
        this.filters = {
            assigned: {transfer:{$exists:true}},
            pending: {transfer:{$exists:false}}
        }
    }

    /**
     * Assigned user
     *
     * @param data
     *
     * @returns {Promise<Query>}
     */
    async assignTransfer(data) {

        const PackagesOld = await Packages.findOne({ _id: data.packagesID});
        const oldTransferId = (PackagesOld.transfer) ? PackagesOld.transfer : false;

        const packagesUp = await Packages.findOneAndUpdate(
            { _id: data.packagesID },
            { $set: { transfer: data.transferId } },
            { new: true }, function(err) {
                if (err) {
                    throw new HttpNotFoundError();
                }
            }).populate({
            path: 'transfer',
            populate: { path: 'user' }
        });

        await TransferProvider.updateStatus({
                transferId: data.transferId,
                packageID: packagesUp._id,
                status: TransferProvider.STATUS_TRANSFER_PROCESSED
            }
        );

        if (oldTransferId) {
            await TransferProvider.updateStatus({
                    transferId: oldTransferId,
                    status: TransferProvider.STATUS_TRANSFER_NEW
                }
            );
        }

        return packagesUp;
    }

    /**
     * Get list users
     *
     * @returns {Promise<*>}
     */
    async getList({filter, page, count}) {

        const query = this.getQueryByFilterCode(filter);
        const skipRow = (count) ? count * (page - 1) : 0;
        const countPage = (count) ? count : 10;

        const packagesList = await Packages.find(query).skip(skipRow).limit(parseInt(countPage)).populate(
            {
                path: 'transfer',
                populate: ['user', 'hospital']
            }
        );

        const maxCount = await Packages.count(query);

        if (!packagesList) {
            throw new HttpNotFoundError();
        }

        return {
          dicoms: packagesList,
          count: maxCount
        }

    }

  /**
   * Return package by package_id
   *
   * @param pid
   * @returns {Promise<*>}
   */
    async getPackageByPid(pid) {
      const packageD = await Packages.findOne({packageId: pid});

      return packageD;
    }

    /**
     * Return query by filter code
     *
     * @param {string} filterCode
     *
     * @returns {{}}
     */
    getQueryByFilterCode(filterCode) {
        if (typeof filterCode === "string") {
            if (this.filters.hasOwnProperty(filterCode)) {
                filterCode = this.filters[filterCode]
            }
        }

        return filterCode;
    }
}

export default new PackagesProvider();
