import Transfer from "../models/transfers";
import htmltopdf  from 'htmltopdf'
import fs  from 'fs'
import dateFormat  from 'dateformat'
import config from '../config'

class TransferPDFProvider {

  /**
   * Get list users
   *
   * @returns {Promise<*>}
   */
  async generateDoc(id) {
    let transfer = await Transfer.findById(id).populate(
      [
        "hospital",
        "user",
      ]
    );
    if(transfer) {
      return await this.createPDF(transfer);
    }
  }

   createPDF(transfer) {
     if(transfer) {
       return new Promise((resolve, reject) => {
         const filepath = config.pathToPdfFilesFolder + transfer._id + ".pdf";
         const fileBytes = fs.readFileSync(config.pathToPdfTempale, 'utf8');
         const userFname = transfer.user.firstName + ' ' + transfer.user.lastName;
         htmltopdf.createFromTemplateData(fileBytes,
           {
             Date: dateFormat(Date.now(), 'mm/dd/yyyy'),
             HName: transfer.hospital.name || '',
             HAddress: transfer.hospital.address || '',
             HCity: transfer.hospital.city || '',
             HSt: transfer.hospital.state || '',
             HZip: transfer.hospital.zip || '',
             PatientName: userFname,
             PatientDOB: transfer.user.dob,
             MRN: transfer.MRN || '',
           },
           filepath, function (err, success) {
           if (err) {
             console.log(err);
             reject(err)
           } else {
             console.log(success);
             return resolve(filepath)
           }
         });
       })
     }
  }

  createMainPDF(user) {
     if(user) {
       return new Promise((resolve, reject) => {
         const filepath = config.pathToPdfFilesFolder + user._id + ".pdf";
         const fileBytes = fs.readFileSync(config.pathToMainPdfTempale, 'utf8');
         const userFname = user.firstName + ' ' + user.lastName;
         htmltopdf.createFromTemplateData(fileBytes,
           {
             Date: dateFormat(Date.now(), 'mm/dd/yyyy'),
             PatientName: userFname,
           },
           filepath, function (err, success) {
           if (err) {
             console.log(err);
             reject(err)
           } else {
             console.log(success);
             return resolve(filepath)
           }
         });
       })
     }
  }


}

export default new TransferPDFProvider();
