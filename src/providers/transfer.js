import {HttpNotFoundError} from "../helpers/errors";
import Transfer from "../models/transfers";
import HashHospital from "../models/hashHospital";
import hospitalProvider from './hospitals'
import translationHelper from '../helpers/translationHelper'
import mail from '../helpers/mail'
import config from '../config'
import {REGISTRATION_SECOND_STEP, REGISTRATION_THIRD_STEP} from '../constants'
import sessionProvider from './session'
import User from '../models/user'
import {getSignedUrlS3, uploadToS3} from '../helpers/S3'
import Annotations from '../models/annotations'
import docuSign from '../helpers/docuSign'
import fs from 'fs'
import _ from "lodash"
import Hospitals from "../models/hospitals";
import ContactPersonProvide from "./contact-persons";
import Dicom from "../models/dicom";

class TransferProvider {

  constructor() {
    this.STATUS_TRANSFER_NEW = 0;
    this.STATUS_TRANSFER_RECEIVED = 2;
    this.STATUS_TRANSFER_PROCESSED = 3;

    this.filters = {
      notAssignedNow: {adminStatus: {$lt: this.STATUS_TRANSFER_PROCESSED}},
    }

  }

  async byID(id) {
    const transfer = await Transfer.findOne({id});
    if (!transfer) {
      throw new HttpNotFoundError();
    }

    return user;
  }

  /**
   * Create list transfer and send email contact personals and update step registration user
   *
   * @param hospitalIds
   * @param user
   * @returns {Promise<*>}
   */
  async createTransfers(hospitalIds, user) {
    if (hospitalIds.id) {
      const newTransfer = await this.create({
        user: user._id,
        hospital: hospitalIds.id,
        MRN: hospitalIds.MRN || ''
      });

      if (user.stepRegistration < REGISTRATION_SECOND_STEP) {
        user.stepRegistration = REGISTRATION_SECOND_STEP;
        await user.save();
      }

      return newTransfer;
    }
  }

  async create(data) {
    const transfer = new Transfer(data);
    await transfer.save();

    return transfer;
  }

  /**
   * If id? return one item or return all items
   *
   * @param {string} id
   *
   * @returns {Promise<*>}
   */
  async get({id, filter, count, page}) {
    if (id) {
      return await this.byID(id);
    } else {
      let transfer = await this.getList(filter, count, page);
      return transfer;
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
    const transfer = await Transfer.findOne({_id: id});
    if (!transfer) {
      throw new HttpNotFoundError();
    }

    return transfer;
  }

  /**
   * Get list users
   *
   * @returns {Promise<*>}
   */
  async getList(filter, countForPage, page) {
    const query = this.getQueryByFilterCode(filter);
    const skipRow = (countForPage) ? countForPage * (page - 1) : 0;
    const countPage = (countForPage) ? countForPage : 10;

    let transfers = await Transfer.find(query).skip(skipRow).limit(parseInt(countPage)).sort({createdAt: -1}).populate(["hospital", "user"]);
    if (!transfers) {
      throw new HttpNotFoundError();
    } else {
      transfers = await this.putS3Url(transfers)
    }

    const count = await Transfer.count(query);

    return {
      count: count,
      transfers: transfers
    };

  }

  /**
   * Get list users
   *
   * @returns {Promise<*>}
   */
  async getArrayListID(filter) {
    let query = this.getQueryByFilterCode(filter);
    const result = [];

    let transfer = await Transfer.find(query).populate(
      [
        "hospital",
        "user",
        {
          path: 'package',
          populate: {path: 'dicom'}
        }
      ]
    );
    transfer = await this.putS3Url(transfer)

    return transfer;
  }

  /**
   * Return dicom by package id
   *
   * @param packageId
   * @returns {Promise<*>}
   */
  async getAllByPackageId(id) {

    let transfer = await Transfer.find({_id: id}).populate(
      [
        "hospital",
        "user",
        {
          path: 'package',
          populate: {path: 'dicom'}
        }
      ]
    );

    transfer = await this.putS3Url(transfer)

    return ( transfer) ? transfer[0]: false
  }

  /**
   * Get list users
   *
   * @returns {Promise<*>}
   */
  async getListHospitalIDByFilter(filter) {
    const query = this.getQueryByFilterCode(filter);
    const result = [];
    const transfer = await Transfer.find(query);
    if (transfer) {
      for (let key in transfer) {
        result.push(transfer[key].hospital)
      }
    }

    return result;
  }

  async putS3Url(transfer) {
    if (transfer) {
      for (let key in transfer) {
        if (
          transfer[key].package
          && transfer[key].package.dicom
          && transfer[key].package.dicom.files
        ) {
          for (let keyFiles in transfer[key].package.dicom.files) {
            if (transfer[key].package.dicom.files[keyFiles].id) {
              transfer[key].package.dicom.files[keyFiles].srcPrv = await this.getS3Url(transfer[key].package.dicom.files[keyFiles].id + 'jpg', "jpeg");
              transfer[key].package.dicom.files[keyFiles].src = await this.getS3Url(transfer[key].package.dicom.files[keyFiles].id + 'png', "png");
            }
          }
        }
        if (transfer[key].envelopeId) {
          transfer[key].envelopeId = await this.getS3Url(transfer[key].envelopeId, 'pdf');
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
   * Return query by filter code
   *
   * @param {string} filterCode
   *
   * @returns {{}}
   */
  getQueryByFilterCode(filterCode) {
    let filterQuery = null;

    if (filterCode) {
      if (typeof filterCode === "string") {
        if (this.filters.hasOwnProperty(filterCode)) {
          filterQuery = this.filters[filterCode]
        }
      } else if (typeof filterCode === "object") {
        filterQuery = (filterCode.filter) ? filterCode.filter : null;
      }
    }

    return filterQuery;
  }

  async redefinitionHospitals({newHospital, oldHospital}) {
    let transfer = {};
    if (newHospital && oldHospital) {
      transfer = await Transfer.findOneAndUpdate(
        {hospital: oldHospital},
        {$set: {hospital: newHospital}},
        {new: true}
      );
    }

    return transfer;
  }

  /**
   * Update status
   *
   * @param {string} userId
   * @param {integer} status
   *
   * @returns {Promise<*>}
   */
  async updateStatus({transferId, status, packageID}) {
    const transfer = await Transfer.findOne({_id: transferId}).populate(["hospital", "user"]);
    if (transfer) {
      if (!transfer.adminStatus) {
        transfer.adminStatus = 0;
      }
      transfer.adminStatus = status;
      if (packageID) {
        transfer.package = packageID;
      }
      if (status !== this.STATUS_TRANSFER_PROCESSED) {
        transfer.package = null;
      }
      await transfer.save();
      return transfer;
    }

    throw new HttpNotFoundError();
  }

  /**
   * Return transfer by filter
   *
   * @param name
   * @returns {Promise<*>}
   */
  async findOneByFilter(filter) {
    return await Transfer.findOne(filter).populate([
      "user",
      {
        path: 'hospital',
        populate: {path: 'contactPerson'}
      }
    ]);
  }

  async findByFilter(filter) {
    return await Transfer.find(filter).populate([
      "user",
      {
        path: 'hospital',
        populate: {path: 'contactPerson'}
      }
    ]);
  }

  async signTransfer(transferId, loadfile) {
    let transfer = await this.findOneByFilter({_id: transferId});

    if (transfer) {
      let filePath;

      if (loadfile) {
        filePath = await docuSign.downloadSignedDoc(transfer.user, transfer.envelopeId)
        await uploadToS3({bucketPath: transfer.envelopeId, filePath: filePath});
        if (fs.existsSync(filePath)) {
          await fs.unlinkSync(filePath);
        }
      }

      filePath = await this.getS3Url(transfer.envelopeId, 'pdf');

      const template = (transfer.hospital.hospitalID) ? 'transferRequestForPatient' : 'transferRequestToAdmin'
      let titleSubject = '';
      let urlToEdit = '';

      if (transfer.hospital.hospitalID) {
        titleSubject = translationHelper(false, "titleSubject.Email.transferRequestForPatient") + transfer.user.firstName + ' ' + transfer.user.lastName;
      } else {
        const hashHospital = new HashHospital({
          hospital: transfer.hospital._id,
          transfer: transfer._id,
        });
        await hashHospital.save();
        urlToEdit = hashHospital._id
        titleSubject = translationHelper(false, "titleSubject.Email.transferRequestToAdmin") + transfer.hospital.name;
      }

      await mail.sendingEmployeeAfterRegistration({
        template: template,
        subjectTitle: titleSubject,
        transferId: transfer._id,
        hospitalName: transfer.hospital.name,
        hospitalAddress: transfer.hospital.address,
        patientName: transfer.user.firstName + ' ' + transfer.user.lastName,
        patientBirthday: transfer.user.dob,
        urlToEdit: `${config.urlToAdmin}/edithospitals/${urlToEdit}`,
        urlToEditTransfer: `${config.urlToAdmin}/transfer`,
        email: transfer.hospital.contactPerson.email,
        attachments: [{
          filePath: filePath,
          filename: 'doc.pdf'
        }]
      })
      transfer.sign = true;
      await transfer.save();

      return transfer;
    }
  }

  async lookupTransfers(hospitals) {
    let hospitalsId = [];
    let transferList = [];
    if (hospitals) {

      for (let key in hospitals) {
        hospitalsId.push(hospitals[key]._id)
        hospitals[key] = hospitals[key].toObject();
        hospitals[key].transfersCount = 0;
      }

      transferList = await Transfer.find({hospital: {$in: hospitalsId}});

      if (transferList) {
        for (let key in transferList) {
          for (let key2 in hospitals) {
            if (hospitals[key2]._id.toString() === transferList[key].hospital.toString()) {
              hospitals[key2].transfersCount++;
            }
          }
        }
      }

    }

    return hospitals;
  }

  async setEnvelopeId(id, envelopeId) {

    const transfer = await Transfer.findOneAndUpdate(
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

export default new TransferProvider();
