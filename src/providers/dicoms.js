import {HttpNotFoundError} from "../helpers/errors";
import Dicom from "../models/dicom";
import {getSignedUrlS3} from "../helpers/S3";

/**
 * Dicoms Provider
 */
class DicomsProvider {

  constructor() {
    this.filters = {
      assigned: {transfer: {$exists: true}},
      pending: {transfer: {$exists: false}}
    }
  }

  /**
   * Get list users
   *
   * @returns {Promise<*>}
   */
  async getList(filter) {
    let dicomsList = await Dicom.find(filter).populate(
      {
        path: 'transfer',
        populate: {path: 'user'}
      }
    );

    if (!dicomsList) {
      throw new HttpNotFoundError();
    }

    dicomsList = await this.putS3Url(dicomsList)
    return dicomsList;
  }

  async putS3Url(transfer) {

    if (transfer && transfer[0] && transfer[0].files) {
      for (let keyFiles in transfer[0].files) {
          if (transfer[0].files[keyFiles].id) {
            transfer[0].files[keyFiles].srcPrv = await this.getS3Url(transfer[0].files[keyFiles].id + 'jpg', "jpeg");
            transfer[0].files[keyFiles].src = await this.getS3Url(transfer[0].files[keyFiles].id + 'png', "png");
          }
        }
    }

    return transfer
  }

  async getS3Url(code, type) {
    const url = getSignedUrlS3({url: code, type: type})
    return url;
  }

  /**
   * Return dicom by package id
   *
   * @param packageId
   * @returns {Promise<*>}
   */
  async getByPackageId(packageId) {
    const dicom = await Dicom.findOne({package: packageId});

    return dicom;
  }

  /**
   * Find need picture and save canvas JSON
   *
   * @param params
   * @returns {Promise<*>}
   */
  async saveCanvas(params) {
    const dicom = await Dicom.update(
      {
        "files": {
          "$elemMatch": {
            "id": {"$eq": params.id},
          }
        }
      },
      {
        $set: {
          "files.$.canvas": params.canvas,
        }
      },
      {multi: true})

    return dicom;
  }
}

export default new DicomsProvider();
