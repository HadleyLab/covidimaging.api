import fs from 'fs';
import Path from 'path';
import aws from 'aws-sdk';
import Handlebars from 'handlebars';
import NodeMailer from 'nodemailer';
import config from '../config';
import logger from './logger';
import translationHelper from './translationHelper';
import {LANGUAGE_EN} from '../constants';

aws.config.update({
  region: config.aws.s3.region,
  credentials: config.aws.ses
});

class Mail {
  constructor() {
    //this.transporter = NodeMailer.createTransport(config.mail.transport.config);

    this.transporter = NodeMailer.createTransport({
      SES: new aws.SES({
        apiVersion: '2010-12-01'
      })
    });

  }


  getTemplate(templateName, data) {
    const templatePath = Path.resolve(__dirname,
      `../emails/${data.language || LANGUAGE_EN}`, `${templateName}.html`);
    return Handlebars.compile(fs.readFileSync(templatePath, 'utf8'));
  }

  getLayoutTemplate() {
    return Handlebars.compile(
      fs.readFileSync(Path.resolve(__dirname, `../emails`, 'layout.html'),
        'utf8'));
  }

  getHtml(templateName, data) {
    const layout = this.getLayoutTemplate();
    const template = this.getTemplate(templateName, {url: config.url, ...data});
    return layout({content: template(data), emailImgPath: config.emailImgPath});
  }

  async send(templateName, data, subjectTitle) {
    const subjectTemp = translationHelper(data.language, subjectTitle || templateName);
    const subject = (subjectTemp) ? subjectTemp : subjectTitle;
    const html = this.getHtml(templateName,
    {imgUrl: config.imgUrl + '/files', ...data});
    const from = config.aws.ses.from;
    let attachments;
    if (data.attachments) {
      attachments = data.attachments.map(
        ({filePath, fileName = 'doc.pdf'}) => {
          return {
            path: filePath,
            filename:fileName
          };
        });
      delete data.attachments;
    }

    this.transporter.sendMail(
      {from, to: data.email, subject, html, attachments},
      (...args) => {
        logger.info(args);
      });
  }

  async sendRegistrationEmail(data) {
    try {
      return await this.send('register', data, data.subjectTitle);
    } catch (e) {
      logger.info(e);
    }
  };

  async sendResetPasswordEmail(data) {
    try {
      return await this.send('resetPassword', data);
    } catch (e) {
      logger.info(e);
    }
  };

  async sendingEmployeeAfterRegistration(data) {
    try {
      return await this.send(data.template, data, data.subjectTitle);
    } catch (e) {
      logger.info(e);
    }
  };

  async sendEmail(data) {
    try {
      return await this.send(data.template, data, data.subjectTitle);
    } catch (e) {
      logger.info(e);
    }
  };

}

export default new Mail();
