import Hospitals from "../models/hospitals";
import ContactPerson from "../models/contactPerson";
import HashHospitalProviders from "../providers/hashHospital";
import ContactPersonProvide from "./contact-persons";
import {HttpNotFoundError} from '../helpers/errors'
import TransferProvider from '../providers/transfer'
import Joi from "joi";
import mail from "../helpers/mail";
import config from "../config";
import translationHelper from "../helpers/translationHelper";
import {ROLE_PATIENT} from "../constants";
import {allowOnly} from "../helpers/authorization";

class HospitalsProvider {

  /**
   * Create new Hospitals
   *
   * @param {object} data
   *
   * @returns {Promise<Model|Aggregate|*>}
   */
  async create(data) {

    const fullPhone = (data.phone && data.phone2)
      ? data.phone + ', ' + data.phone2
      : (data.phone)
        ? data.phone
        : null
    ;

    const hospital = new Hospitals(
      {
        name: (data.name) ? data.name : '',
        address: (data.address) ? data.address : '',
        hospitalID: (data.hospitalID) ? data.hospitalID : '',
        state: (data.state) ? data.state : '',
        city: (data.city) ? data.city : '',
        zip: (data.zip) ? data.zip : '',
        phone: (fullPhone) ? fullPhone : '',
        active: (data.active) ? true : false

      }
    );
    await hospital.save();

    if (data.contactPerson_firstName) {
      const ContactPerson = await ContactPersonProvide.create(
        {
          firstName: data.contactPerson_firstName,
          lastName: data.contactPerson_lastName,
          email: data.contactPerson_email,
        }
      );
      hospital.contactPerson = ContactPerson._id;
    }

    await hospital.save();

    return hospital;
  }

  /**
   * Update Hospitals
   *
   * @param {object} data
   *
   * @returns {Promise<Model|Aggregate|*>}
   */
  async update(data) {

    const fields = {
      name: (data.name) ? data.name : '',
      address: (data.address) ? data.address : '',
      hospitalID: (data.hospitalID) ? data.hospitalID : '',
      state: (data.state) ? data.state : '',
      city: (data.city) ? data.city : '',
      zip: (data.zip) ? data.zip : '',
      phone: (data.phone) ? data.phone : '',
      active: (data.active) ? true : false
    };

    const oldDataHospital = await this.byID(data._id);

    const hospital = await Hospitals.findOneAndUpdate(
      {_id: data._id},
      {$set: fields},
      {new: true}, async (err, doc) => {
        if (err) {
          throw new HttpNotFoundError();
        }
      });

    if (data.contactPerson_id) {
      await ContactPersonProvide.update({
          data: {
            _id: data.contactPerson_id,
            firstName: data.contactPerson_firstName,
            lastName: data.contactPerson_lastName,
            email: data.contactPerson_email,
          }
        }
      );
    } else {
      const ContactPerson = await ContactPersonProvide.create(
        {
          firstName: data.contactPerson_firstName,
          lastName: data.contactPerson_lastName,
          email: data.contactPerson_email,
        }
      );
      hospital.contactPerson = ContactPerson._id;
      await hospital.save();
    }


    if (data.hospitalID) {
      await HashHospitalProviders.signTransferByHospitalId(hospital._id);
    }

    if (data.active && !oldDataHospital.active) {
      await this.sendEmailUserAfterSuccessfulModeration({hospitalID: hospital._id});
    }

    return hospital;
  }

  async sendEmailUserAfterSuccessfulModeration({hospitalID, transfer}) {

    if (hospitalID) {
      let filter = {hospital: hospitalID, sign: {$eq: false}}
      if (transfer) {
        filter._id = transfer._id;
      }
      const transfers = await TransferProvider.findByFilter(filter);
      if (transfers) {
        for(let key in transfers) {
          let transferItem = transfers[key];
          await mail.sendingEmployeeAfterRegistration({
            template: "emailUserAfterSuccessfulModeration",
            subjectTitle: translationHelper(false, "titleSubject.Email.emailUserAfterSuccessfulModeration"),
            hospitalName: transferItem.hospital.name,
            hospitalAddress: transferItem.hospital.address,
            patientName: transferItem.user.firstName + ' ' + transferItem.user.lastName,
            patientBirthday: transferItem.user.dob,
            urlToEdit: `${config.url}files/`,
            email: transferItem.user.email
          })
        }

      }
    }
  }

  async sendEmailForModerationHospital({hospital, user}) {

    if (hospital) {
          await mail.sendEmail({
            template: "sendEmailForModerationHospital",
            subjectTitle: translationHelper(false, "titleSubject.Email.sendEmailForModerationHospital") + hospital.name,
            hospitalName: hospital.name,
            hospitalAddress: hospital.address,
            patientName: user.firstName + ' ' + user.lastName,
            urlToEdit: `${config.urlToAdmin}/notactivehospitals?hospital=${hospital.name}`,
            email: config.adminEmail
          })
      }

  }

  /**
   * Found and remove by _id
   *
   * @param {string} id =_id
   *
   * @returns {Promise<*>}
   */
  async delete(id) {
    let result = await Hospitals.findOne({_id: id}).remove();
    if (!result) {
      throw new HttpNotFoundError();
    }
    console.log('delete');
    return result;
  }

  async get({id, count, page, q, noCalcCount, patientQuery, type}) {
    if (id) {

      return await this.byID(id);
    } else {
      if (type) {
        patientQuery.active = {$eq: (type === 'active') ? true : false}
      }

      return await this.getList(count, page, q, noCalcCount, patientQuery,  {createdAt: -1});
    }
  }

  /**
   * Return Hospitals by ID
   *
   * @param id
   * @returns {Promise<*>}
   */
  async byID(id) {
    let hospital = await Hospitals.findOne({_id: id}).populate('contactPerson');
    if (!hospital) {
      throw new HttpNotFoundError();
    }
    hospital = hospital.toObject()

    if (hospital.contactPerson) {
      hospital.contactPerson_id = hospital.contactPerson._id;
      hospital.contactPerson_firstName = hospital.contactPerson.firstName;
      hospital.contactPerson_lastName = hospital.contactPerson.lastName;
      hospital.contactPerson_email = hospital.contactPerson.email;
    }

    return hospital;
  }

  /**
   * Return Hospitals by filter
   *
   * @param name
   * @returns {Promise<*>}
   */
  async byFilter(filter) {
    return await Hospitals.find(filter).populate('contactPerson');
  }

  /**
   * Return Hospitals by filter
   *
   * @param name
   * @returns {Promise<*>}
   */
  async findOneByFilter(filter) {
    return await Hospitals.findOne(filter).populate('contactPerson');
  }

  /**
   * Return is unique hospital
   *
   * @param {string} name
   * @param {string} address
   *
   * @returns {Promise<boolean>}
   */
  async isUniqueHospital(name, address) {
    const hospital = await this.byFilter(
      {
        name: name,
        address: address
      }
    );

    return (hospital.hasOwnProperty('0')) ? false : true;
  }

  /**
   * Get all hospitals
   *
   * @returns {Promise<*>}
   */
  async getList(countForPage, page, q, noCalcCount, patientQuery, sort) {
    const skipRow = (countForPage) ? countForPage * (page - 1) : 0;
    const countPage = (countForPage) ? countForPage : 10;
    let filter = (q && q.length > 0) ? {name: new RegExp(q, 'gi')} : {};
    if (patientQuery) {
      filter = {...filter, ...patientQuery}
    }

    const count = (noCalcCount) ? 0 : await Hospitals.count(filter);
    const hospital = await Hospitals.find(filter).populate('contactPerson').sort(sort).skip(skipRow).limit(parseInt(countPage));

    if (!hospital) {
      throw new HttpNotFoundError();
    }

    return {
      count: count,
      hospitals: hospital
    };
  }

  async list(params) {
    const countForPage = (params.countForPage) ? params.countForPage : 10;
    const needUpdateCity = (params.needUpdateCity) ? params.needUpdateCity : false;
    const page = (params.page) ? params.page : 1;
    const state = (params.state) ? params.state : false;
    const sort = (params.sort) ? params.sort : {createdAt: -1};
    let search = (params.search) ? params.search : false;
    const city = (params.city) ? params.city : false;

    let result = [];
    let filter = {}

    filter.active = {$eq: true};

    if (state) {
      filter = {
        state: {$eq: state}
      };
    }

    if (city) {
      filter.city = {$eq: city};
    }

    if (search) {
      search = new RegExp(search, 'gi');
      filter.$or = [
        {name: search},
        {zip: search},
        {phone: search},
        {address: search},
      ];
    }

    result = await this.getList(countForPage, page, '', false, filter, sort);
    result.page = page;

    if (needUpdateCity) {
      result.city = await this.getListCityByState(state);
    }

    return result;
  }

  async getListCityByState(state) {

    const city = await Hospitals.distinct("city", {state: {$eq: state}});

    return city.sort();
  }
}

export default new HospitalsProvider();
