import csv from 'csvtojson';
import HospitalsProvider from './hospitals';
import ContactPersonsProvider from './contact-persons';
import Hospitals from "../models/hospitals";

/*
 * Import hospitals
 *
 * @category    provider
 * @author      Stas Shevchenko
 * @copyright   Copyright ©2018  nordwhale.com
 * @since       version 1.0
 */

class importHospitals {

    /**
     * Constructor
     */
    constructor() {
        this.defaultDataCPersons = {
            firstName: "Doctor",
            lastName: "Doctor",
            email: "Dexter.Hadley@ucsf.edu",
        };
        this.pathToFileImport = "./import/csv/hospitals.csv";
    }

    /**
     * Run import
     *
     * @returns {Promise<boolean>}
     */
    async run() {
        const listHospitals = await this.parsing();

        for (let key in listHospitals) {
            if (
                listHospitals.hasOwnProperty(key)
                && listHospitals[key].hasOwnProperty('field1')
                && listHospitals[key].field1
                && listHospitals[key].field2
            ) {
                let nameH = listHospitals[key].field1;
                let addressH = await this.getAddress(listHospitals[key]);
                let city = (listHospitals[key].hasOwnProperty('field5')) ? listHospitals[key].field5 : '';
                let state = (listHospitals[key].hasOwnProperty('field6')) ? listHospitals[key].field6 : '';
                let zip = (listHospitals[key].hasOwnProperty('field7')) ? listHospitals[key].field7 : '';

                let phone = (listHospitals[key].hasOwnProperty('field8')) ? listHospitals[key].field8 : '';
                    phone += (listHospitals[key].hasOwnProperty('field9')) ? ', ' + listHospitals[key].field9 : '';

                let isHospitaUnique = await HospitalsProvider.isUniqueHospital(nameH, addressH);
                if (isHospitaUnique) {
                    let contactPerson = await ContactPersonsProvider.create(this.defaultDataCPersons);
                    let hospital = await new Hospitals({
                        name: nameH,
                        city: city,
                        state: state,
                        zip: zip,
                        phone: phone,
                        contactPerson: contactPerson._id,
                        address: addressH,
                        active: true
                    });
                    await hospital.save();
                }
            }
        }

        return true;
    }

  /**
   * Return address concatenation
   *
   * @param item
   *
   * @returns {Promise<string>}
   */
    async getAddress(item) {
      let address = '';
      address += (item.hasOwnProperty('field2')) ? ' ' + item.field2 : '';
      address += (item.hasOwnProperty('field3')) ? ' ' + item.field3 : '';
      address += (item.hasOwnProperty('field4')) ? ' ' + item.field4 : '';

      return address;
    }


    /**
     * Parsing fail
     *
     * @returns {Promise<*>}
     */
    async parsing() {
        return await csv(
            {
                delimiter: '|',
                noheader: true
            }
            ).fromFile(this.pathToFileImport);
    }
}

export default new importHospitals();
