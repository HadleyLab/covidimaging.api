
import fs from 'fs';
import unzip from 'unzip';
import rimraf from 'rimraf';
import fsE from 'fs-extra';
import fsUtils from "nodejs-fs-utils";
import path from 'path';
import xml2js from 'xml2js';
import config from '../config'
import packageModel from '../models/package';
import dicomModel from '../models/dicom'
import importDicom from './import-dicom'
import HospitalsProvider from '../providers/hospitals';
import UserProvider from '../providers/user';
import TransferProvider from '../providers/transfer';
import PackagesProvider from '../providers/packages';
import DicomProvider from '../providers/dicoms';
import dateFormat from "dateformat"
import md5 from 'md5'
/**
 * Import DICOM to jpg and save info BD
 */
class importPackDCM {

    constructor () {
      this.mainPath = config.pathToFolderDicomFiles
    }

    /**
     * Run import
     *
     * @returns {Array}
     */
    async run ()
    {
        this.result = [];
        await this.startImport();

        return this.result;
    }

    /**
     * Start import
     *
     * @param importPathFolder
     * @returns {Promise<void>}
     */
  async startImport () {
    await this.runUnZip();
    const listFolderToParser = await this.getValidListFolders();
    if (listFolderToParser) {
      const packegeInfo = await this.parseXML(listFolderToParser);
      if (packegeInfo) {
        for (let key in packegeInfo) {
          let packegeParams = packegeInfo[key];
          try {
            await this.clearingDuplicate(packegeParams);
            let packageM = new packageModel(packegeParams);
            await packageM.save();
            await importDicom.run(packegeParams.pathToDICOMFolder, packageM);
            await this.autoMatching(packageM);
            await this.deletePath(packegeParams.pathToPack)
          } catch (e){
            console.log(e)
          }
        }
      }
    }
  }

  /**
   * Find a package and remove it and its DICOM
   *
   * @param packegeParams
   * @returns {Promise<void>}
   */
  async clearingDuplicate(packegeParams) {
    const packageD = await PackagesProvider.getPackageByPid(packegeParams.packageId)
    if (packageD) {
      const dicom = await DicomProvider.getByPackageId(packageD._id)
      if (dicom) {
        dicom.remove();
        packageD.remove();
      }
    }

    return;
  }

  /**
   * Foreach unzip
   *
   * @returns {Promise<void>}
   */
  async runUnZip() {
    const dirs = fs.readdirSync(this.mainPath);

    if (dirs) {
      for (const i in dirs) {
        let path = this.mainPath + '/' + dirs[i];
        let exp = path.split('.').pop();
        if (exp === 'zip') {
          await this.unZip(path);
          await this.deletePath(path);
        }
      }
    }

    return ;
  }

  /**
   * Delete object in path folder or file
   *
   * @param dir_path
   * @returns {Promise<void>}
   */
  async deletePath(dir_path) {
    if (fs.existsSync(dir_path)) {
      if (fs.lstatSync(dir_path).isDirectory()) {
        rimraf.sync(dir_path);
      } else {
        fs.unlinkSync(dir_path);
      }
    }
    return;
  }

  /**
   * Un zip
   * @param filePath
   * @returns {Promise<any>}
   */
  async unZip(filePath) {
    return new Promise((resolve, reject) => {
      const unzipExtractor = unzip.Extract({ path: this.mainPath });
      unzipExtractor.on('close', () => {
        return resolve();
      });
      fs.createReadStream(filePath).pipe(unzipExtractor);
    });
  }

  async autoMatching(packageM) {
    const hospital =  await HospitalsProvider.findOneByFilter({hospitalID: packageM.hospitalId})
    if (hospital) {
      const dob = dateFormat(new Date(packageM.patient.dob), 'mm/dd/yyyy');

      let hash = packageM.patient.first_name + packageM.patient.last_name + dob
      hash = md5(hash.toLowerCase());

      const user = await UserProvider.findOneByFilter({hash: hash})
      if (user) {
        const transfer = await TransferProvider.findOneByFilter({
          hospital: hospital._id,
          user: user._id
        })
        if (transfer) {
          transfer.package = packageM._id;
          transfer.adminStatus = TransferProvider.STATUS_TRANSFER_PROCESSED
          packageM.transfer = transfer._id
          await packageM.save();
          await transfer.save();
        }
      }
    }
  }

  /**
   * Parse xml package
   * @param listFolderToParser
   *
   * @returns {object}
   */
  async parseXML(listFolderToParser) {
    if (listFolderToParser) {
      for (let key in listFolderToParser) {
        let bufXML = await fs.readFileSync(listFolderToParser[key].pathToXML, "utf8");
        let parsResult = {};
        xml2js.parseString(bufXML, (err, result) => {
          parsResult = result;
        });

        listFolderToParser[key].packageId = parsResult.root.package_id[0];
        listFolderToParser[key].hospitalId = parsResult.root.sender[0].matrixray_sender_id[0],
        //info for patient
        listFolderToParser[key].patient = {
          first_name: parsResult.root.patient[0].patient_first_name[0],
          last_name: parsResult.root.patient[0].patient_last_name[0],
          dob: parsResult.root.patient[0].patient_dob[0],
          id: parsResult.root.patient[0].patient_id[0],
        };
        listFolderToParser[key].xml = parsResult
      }
    }

    return listFolderToParser;
  }

  /**
   * Get list valid folder from import
   * @returns {Promise<Array>}
   */
  async getValidListFolders () {
      const dirs = fs.readdirSync(this.mainPath);
      const result = [];
      if (dirs) {
        for (let i in dirs) {
          let path = this.mainPath + '/' + dirs[i];
          let pathToxmlFile = `${path}/info.xml`;
          let pathToDICOMFolder = `${path}/dicom`;
          if (
            fs.statSync(path).isDirectory()
            && fs.existsSync(pathToxmlFile)
            && fs.existsSync(pathToDICOMFolder)
          ){
            result.push({
              pathToPack: path,
              pathToXML: pathToxmlFile,
              pathToDICOMFolder: pathToDICOMFolder,
            });
          }
        }
      }

      return result;
    }

    /**
     * Generate list files to import
     *
     * @param {string} mainDir
     * @param {array} dirs_
     * @returns {*|Array}
     */
    getListFolders(mainDir, dirs_)
    {
        dirs_ = dirs_ || [];
        let dirs = fs.readdirSync(mainDir);
        for (let i in dirs) {
            let name = mainDir + '/' + dirs[i];
            if (fs.statSync(name).isDirectory()){
                dirs_.push(name);
                this.getListFolders(name, dirs_);
            }
        }

        return dirs_;
    }
}

export default new importPackDCM();