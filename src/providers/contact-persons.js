import CPersons from "../models/contactPerson";
import Hospitals from '../models/hospitals'

class ContactPersonsProvider {

    /**
     * Create new persons
     *
     * @param {object} data
     *
     * @returns {Promise<Model|Aggregate|*>}
     */
    async create(data) {
        const persons = new CPersons(data);
        await persons.save();

        return persons;
    }

    /**
     * Update Hospitals
     *
     * @param {object} data
     *
     * @returns {Promise<Model|Aggregate|*>}
     */
    async update({data}) {
        const personal = CPersons.findOneAndUpdate(
            { _id: data._id },
            { $set: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                }
            },
            { new: true }, function(err, doc) {
                if (err) {
                    throw new HttpNotFoundError();
                }
            });

        return personal;
    }

  /**
   * Update personal data by filters
   *
   * @param data
   * @param filter
   *
   * @returns {Promise<boolean>}
   */
  async updateByFilter(data, filter) {

    return await CPersons.update(
      { ...filter },
      { $set: {...data} },
      {  multi: true }
    );

  }

}

export default new ContactPersonsProvider();
