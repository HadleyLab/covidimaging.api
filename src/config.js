import path from 'path'
import { config } from 'dotenv'

const {name, version} = require('../package.json')
config()

const env = process.env.NODE_ENV
const conf = {
  name, version, env,
  baseRoute: '/api',
  encoderUrl: process.env.ENCODER_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtEncryptToken: process.env.JWT_ENCRYPT_TOKEN,
  emailImgPath: process.env.EMAIL_IMG_PATH,
  url: process.env.URL,
  urlToAdmin: process.env.URL_ADMIN,
  adminEmail: process.env.ADMIN_EMAIL,
  filesDir: path.join(__dirname, '..', 'files'),
  pathToFolderDicomFiles: process.env.PATH_TO_FOLDER_DICOM_FILES,
  pathToImgDicomFilesFolder: process.env.PATH_TO_IMG_DICOM_FILES_FOLDER,
  pathToPdfFilesFolder: process.env.PATH_TO_PDF_FOLDER,
  pathToPdfTempale: process.env.PATH_TO_PDF_HTML_TEMPLATE,
  pathToMainPdfTempale: process.env.PATH_TO_MAIN_PDF_HTML_TEMPLATE,
  db: {
    uri: process.env.DB_URI,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    options: { useNewUrlParser: true }
  },
  aws:{
    s3:{
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRETACCESSKEY,
      bucket: process.env.S3_BUCKET,
    },
    ses:{
      region: (process.env.SES_REGION) ? process.env.SES_REGION : process.env.S3_REGION,
      from: process.env.SES_FROM,
      accessKeyId: (process.env.SES_ACCESS_KEY) ? process.env.SES_ACCESS_KEY : process.env.S3_ACCESS_KEY,
      secretAccessKey: (process.env.SES_SECRETACCESSKEY) ? process.env.SES_SECRETACCESSKEY : process.env.S3_SECRETACCESSKEY
    }
  },
  docuSign: {
    id: process.env.DOCUSIGN_ID,
    login: process.env.DOCUSIGN_LOGIN,
    templatePatient: process.env.DOCUSIGN_TEMPLATE_PATIENT,
    password: process.env.DOCUSIGN_PASSWORD,
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
    secretKey: process.env.DOCUSIGN_SECRET_KEY,
    isDemo: process.env.DOCUSIGN_IS_DEMO,
    redirectUrl: process.env.DOCUSIGN_REDIRECT_URL,
  },
  cors: {},
  joi: {
    abortEarly: false,
    allowUnknown: true,
    noDefaults: true,
  },
  mail: {
    emergencyEmails: 'alexey.kosinski@nordwhale.com',
    transport: null,
    production: {
      config: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false, // use SSL
        tls: {ciphers: 'SSLv3'},
        auth: {
          user: process.env.MAIL_LOGIN,
          pass: process.env.MAIL_PASS,
        },
      },
      contact: {
        from: process.env.MAIL_LOGIN,
      },
    },
    development: {
      config: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        //secure: true, // use SSL
        auth: {
          user: process.env.MAIL_LOGIN,
          pass: process.env.MAIL_PASS,
        },
      },
      contact: {
        from: process.env.MAIL_LOGIN,
      },
    },
  },
}
conf.mail.transport = env === 'prod' ? conf.mail.production : conf.mail.development
export default conf
