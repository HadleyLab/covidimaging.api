
import fs from 'fs';
import gm from 'gm';
import md5 from 'md5';
import fsE from 'fs-extra';
import fsUtils from "nodejs-fs-utils";
import daikon from 'daikon';
import path from 'path';
import jpeg from 'jpeg-js';
import {uploadToS3} from '../helpers/S3'

import dicomModel from '../models/dicom';
import toArrayBuffer from 'to-arraybuffer';
import config from '../config'
import rimraf from 'rimraf'
/**
 * Import DICOM to jpg and save info BD
 */
class importDCM {

    /**
     * Constructor
     */
    constructor ()
    {
        this.result = [];
        this.listTags = {
            '00100010':{
                info: 'Patients Name Attribute',
                fieldName: 'patientsName',
                inObject: false
            },
            '00100020':{
                info: 'Patient ID Attribute',
                fieldName: 'patientId',
                inObject: false
            },
            '00100030':{
                info: 'Patients Birth Date Attribute',
                fieldName: 'dob',
                inObject: false
            },
            '00200010':{
                info: 'Study ID',
                fieldName: 'studyID',
                inObject: false
            },
            '00100040':{
                info: 'Sex',
                inObject: true
            },
            '00102297':{
                info: 'Responsible Person',
                inObject: true
            },
            '00080020':{
                info: 'Study Date',
                inObject: true
            },
            '00080090':{
                info: 'Referring Physicians Name',
                inObject: true
            },
            '0008009C':{
                info: 'Consulting Physicians',
                inObject: true
            },
            '00081030':{
                info: 'Study Description',
                inObject: true
            },
            '00401012':{
                info: 'Reason For Performed Procedure Code Sequence',
                inObject: true
            },
            '00081080':{
                info: 'Admitting Diagnoses Description',
                inObject: true
            },
            '00101010':{
                info: 'Patients Age',
                inObject: true
            },
            '00101020':{
                info: 'Patients Size',
                inObject: true
            },
            '00101030':{
                info: 'Patients Weight',
                inObject: true
            },
            '00102000':{
                info: 'Medical Alerts',
                inObject: true
            },
            '00102110':{
                info: 'Allergies',
                inObject: true
            },
            '001021A0':{
                info: 'Smoking',
                inObject: true
            },
            '001021C0':{
                info: 'Pregnancy',
                inObject: true
            },
            '001021D0':{
                info: 'Last Menstrual Date',
                inObject: true
            },
            '00380500':{
                info: 'Patient State',
                inObject: true
            },
            '00102180':{
                info: 'Occupation',
                inObject: true
            },
            '001021B0':{
                info: 'Additional Patient History',
                inObject: true
            },
            '00080070':{
                info: 'Manufacturer',
                inObject: true
            },
            '00080080':{
                info: 'Institution Name',
                inObject: true
            },
            '00081010':{
                info: 'Station Name',
                inObject: true
            },

        };
    }

  /**
   *
   * @param path
   * @param package
   * @returns {Promise<Array>}
   */
    async run (path, packageM)
    {
        this.result = [];
        await this.startImport(path, packageM);

        return this.result;
    }

    /**
     * Start import
     *
     * @param importPathFolder
     * @returns {Promise<void>}
     */
    async startImport (importPathFolder, packageM)
    {
        let folderList = this.getListFolders(importPathFolder);
        if (typeof folderList === "object") {
            for (let i in folderList) {
                if (this.isFileInFolder(folderList[i])) {
                    await this.importFiles(folderList[i], packageM);
                }
            }
        }
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
            } else {
              dirs_.push(mainDir);
            }
        }

        return dirs_;
    }

    /**
     * Import process
     *
     * @param {string} folderPath
     * @returns {array}
     */
   async importFiles(folderPath, packageM)
    {
        let patient;
        let files = fs.readdirSync(folderPath);
        const pathSave = folderPath.replace(config.pathToFolderDicomFiles, config.pathToImgDicomFilesFolder);
        /** Create folder to save */
        fsUtils.mkdirsSync(pathSave);
        for (let ctr in files) {
            let name = path.join(folderPath, files[ctr]);

            let newNameFile = new Date().getTime();
            if (fs.statSync(name).isFile()) {
                let buf = fs.readFileSync(name);
                let image = daikon.Series.parseImage(new DataView(toArrayBuffer(buf)));
                let pathEndNameFile = pathSave + '/' + newNameFile;
                let code = md5(pathEndNameFile);
                await this.createPreview(name, pathEndNameFile, code);
                await this.createPng(name, pathEndNameFile, code);
                fs.unlinkSync(name);
                patient = this.getPatientInfo(image);
                  patient.files = {
                    id: code,
                    canvas: ''
                  }
                patient.package = packageM._id;
                await this.saveToMongo(patient, packageM);
            }
        }
        await this.deletePath(pathSave);
        return patient;
    }

    async createPreview(dcm, pathEndNameFile, code) {
        const Previewfile = pathEndNameFile + '.jpg';
        if (fs.statSync(dcm).isFile()) {
        return new Promise((resolve, reject) => {
          let imageMagick = gm.subClass({imageMagick: true});
          imageMagick(dcm)
          .resize(300, 300)
          .write(Previewfile, async function (err) {
            if (!err) {
              await uploadToS3({bucketPath:code+'jpg', filePath:Previewfile});
              resolve();
            }
            else console.log(err)
          });
        });

      }
    }

    async createPng(dcm, pathEndNameFile, code) {
        const pngfile = pathEndNameFile + '.png';
        if (fs.statSync(dcm).isFile()) {
          return new Promise((resolve, reject) => {
            let imageMagick = gm.subClass({imageMagick: true});
            imageMagick(dcm)
            .write(pngfile, async function async(err) {
              if (!err) {
                await uploadToS3({bucketPath: code+'png', filePath: pngfile});
                resolve();
              }
              else console.log(err)
            });
          });
        }
    }
    /**
     * Is folder empty
     *
     * @param {string} path
     *
     * @returns {boolean}
     */
    isFileInFolder(path)
    {
        let dirs = fs.readdirSync(path);
        for (let i in dirs) {
            let name = path + '/' + dirs[i];
            if (fs.statSync(name).isFile()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Return info from image
     *
     * @param {object} image
     * @returns {{}}
     */
    getPatientInfo(image)
    {
        let patientInfo = {};
        for (let i in this.listTags) {

            let params = this.listTags[i];
            let group = i.substring(0, 4);
            let element = i.substring(4);
            let tagInfo = image.getTag(parseInt(group, 16), parseInt(element, 16))
            let save = {};
            let namePro = params.info.replace(/\s/ig, '-').toLowerCase();

            save[namePro] = params;
            if (typeof tagInfo === 'object') {
                if (params.inObject) {
                    params.value = tagInfo.value;
                    patientInfo.more = Object.assign({}, patientInfo.more, save);
                } else {
                    let fieldName = params.fieldName;
                    patientInfo[fieldName] = (tagInfo.value) ? tagInfo.value[0] : null ;
                }
            } else {
                params.value = null;
                patientInfo.more = Object.assign({}, patientInfo.more, save);
            }
        }
        patientInfo.files = [];

        return patientInfo;
    }

  /**
   * Save to collection
   *
   * @param {object}  params
   * @param {object}   packageM
   * @returns {Promise<*>}
   */
    async saveToMongo (params, packageM)
    {
        let dicom = await dicomModel.findOne({'studyID': params.studyID})
        if (dicom) {
          dicom.files.push(params.files)
        } else {
          dicom = new dicomModel(params);
        }
        await dicom.save();
        packageM.dicom = dicom._id;
        await packageM.save();

        return dicom;
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
}

export default new importDCM();