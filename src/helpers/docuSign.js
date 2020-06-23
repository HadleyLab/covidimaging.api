import config from '../config'
import docusign from 'docusign-esign'
import path from 'path'
import fs from 'fs'
import TransferProviders from '../providers/transfer'
import userProviders from '../providers/user'
import transferPdf from '../providers/transfer-pdf'

let testDocumentPath = '../pdf/test.pdf'

class DocuSign {
  constructor () {
    this.integratorKey = config.docuSign.integrationKey
    this.docusignEnv = config.docuSign.isDemo ? 'demo' : 'prod'
    this.templateId = config.docuSign.templatePatient
    this.baseUrl = `https://${this.docusignEnv}.docusign.net/restapi`
    this.apiClient = new docusign.ApiClient()
    this.userId = config.docuSign.id
    this.oAuthBaseUrl = config.docuSign.isDemo ? 'account-d.docusign.com' : 'account.docusign.com'
    this.redirectSignURI = config.docuSign.redirectUrl
    this.privateKeyFilename = '../keys/docusign_private_key.txt'
  }

  // https://account-d.docusign.com/oauth/auth?response_type=token&scope=signature&client_id=alexey.kosinski@nordwhale.com&state=a39fh23hnf23&redirect_uri=http://localhost:3000/docusign/callback
  async init (user) {
    return new Promise((resolve, reject) => {
      this.apiClient.setBasePath(this.baseUrl)
      docusign.Configuration.default.setDefaultApiClient(this.apiClient)
      const redirectSignURI = `${this.redirectSignURI}\\${user._id}`;
      const oauthLoginUrl = this.apiClient.getJWTUri(this.integratorKey, redirectSignURI, this.oAuthBaseUrl)
      this.apiClient.configureJWTAuthorizationFlow(path.resolve(__dirname, this.privateKeyFilename),
        this.oAuthBaseUrl,
        this.integratorKey,
        this.userId, 3600,
        (err, d) => {
          if (err) {
            return reject(err)
          }
          resolve(d)
        })
    })

  }

  async login (user) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init(user)
      } catch (e) {
        reject(e)
      }
      const authApi = new docusign.AuthenticationApi()
      const loginOps = {}
      loginOps.apiPassword = true
      loginOps.includeAccountIdGuid = true
      authApi.login(loginOps, (err, loginInfo, response) => {
        if (err) {
          return reject(err)
        }
        if (loginInfo) {
          const loginAccounts = loginInfo.loginAccounts
          const loginAccount = loginAccounts[0]
          const accountId = loginAccount.accountId
          const baseUrl = loginAccount.baseUrl
          const accountDomain = baseUrl.split('/v2')
          this.apiClient.setBasePath(accountDomain[0])
          docusign.Configuration.default.setDefaultApiClient(this.apiClient)
          this.loginAccount = loginAccount
          resolve()
        }
      })
    })
  }

  async Send(user, pathTodoc) {

    const fileBytes = fs.readFileSync(pathTodoc)
    let envDef = new docusign.EnvelopeDefinition()
    envDef.emailSubject = 'Please sign this document sent from Node SDK'

    let doc = new docusign.Document()
      , base64Doc = Buffer.from(fileBytes).toString('base64')
    doc.documentBase64 = base64Doc
    doc.name = 'TestFile.pdf' // can be different from actual file name
    doc.extension = 'pdf'
    doc.documentId = '1'
    // Add to the envelope. Envelopes can have multiple docs, so an array is used
    envDef.documents = [doc]

    let signer = docusign.Signer.constructFromObject(
      {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        recipientId: '1',
        routingOrder: '1'
      })

    signer.clientUserId = user._id

    let signHere = docusign.SignHere.constructFromObject({
      anchorString: '/sh1/',
      anchorYOffset: '10', anchorUnits: 'pixels',
      anchorXOffset: '0',
    })

    // A signer can have multiple tabs, so an array is used
    let signHereTabs = [signHere]
      , tabs = docusign.Tabs.constructFromObject({
      signHereTabs: signHereTabs,
    })
    signer.tabs = tabs

    envDef.recipients = new docusign.Recipients()
    envDef.recipients.signers = [signer]

    // Send the envelope by setting |status| to "sent". To save as a draft set to "created"
    envDef.status = 'sent'

    const envelopesApi = new docusign.EnvelopesApi()
    return {envDef: envDef, envelopesApi: envelopesApi}
  }

  async sendByFile (user, transferId) {

    const documentPath = await transferPdf.generateDoc(transferId);

    let sender = await this.Send(user, documentPath)

    return new Promise((resolve, reject) => {
      sender.envelopesApi.createEnvelope(this.loginAccount.accountId, {envelopeDefinition: sender.envDef},
        (err, envelopeSummary, response) => {
          console.log('createEnvelope: ', envelopeSummary)
          if (err) {
            reject(err)
          }
          resolve(envelopeSummary && envelopeSummary.envelopeId)
        })
    }).then(async (envelopeId) => {
      await TransferProviders.setEnvelopeId(transferId, envelopeId)

      return await this.createRecipientView(user, this.loginAccount.accountId, envelopeId, user._id, transferId)
    })
  }

  async sendByMainFile (user) {
    const documentPath = await transferPdf.createMainPDF(user);

    let sender = await this.Send(user, documentPath)

    return new Promise((resolve, reject) => {
      sender.envelopesApi.createEnvelope(this.loginAccount.accountId, {envelopeDefinition: sender.envDef},
        (err, envelopeSummary, response) => {
          console.log('createEnvelope: ', envelopeSummary)
          if (err) {
            reject(err)
          }
          resolve(envelopeSummary && envelopeSummary.envelopeId)
        })
    }).then(async (envelopeId) => {
      await userProviders.setEnvelopeId(user._id, envelopeId)

      return await this.createRecipientView(user, this.loginAccount.accountId, envelopeId, user._id, 'mainSign')
    })
  }

  async sendTemplate (user) {
    let envDef = new docusign.EnvelopeDefinition()
    envDef.emailSubject = 'Please sign this document sent from Node SDK'
    envDef.templateId = this.templateId

    let tRole = new docusign.TemplateRole()
    tRole.roleName = 'Patient'
    tRole.name = `${user.firstName} ${user.lastName}`
    tRole.email = user.email
    tRole.email = user.email

    let templateRolesList = []
    templateRolesList.push(tRole)

    envDef.templateRoles = templateRolesList
    envDef.status = 'sent'

    let accountId = this.loginAccount.accountId

    // instantiate a new EnvelopesApi object
    let envelopesApi = new docusign.EnvelopesApi()

    // call the createEnvelope() API

    let envelopeId = await new Promise((resolve, reject) => {
      envelopesApi.createEnvelope(accountId, {'envelopeDefinition': envDef}, (err, envelopeSummary, response) => {
        if (err) {
          console.log(err)
          resolve(1)
        } else {
          //console.log('Template EnvelopeSummary: ', accountId, envelopeSummary.envelopeId);
          resolve(envelopeSummary && envelopeSummary.envelopeId)
        }
      })
    })

    if (true) {
      let url = await this.createRecipientView(user, accountId, envelopeId, user._id)
      console.log('Template EnvelopeSummary: ' + JSON.stringify(envelopeId), url)
    }

    console.log('envelopeId: ', envelopeId)

  }

  async createRecipientView (user, accountId, envelopeId, clientUserId, params) {
    let envelopesApi = new docusign.EnvelopesApi()
    let viewRequest = new docusign.RecipientViewRequest()
    const redirectSignURI = `${this.redirectSignURI}\\${user._id}\\${params}`;
    viewRequest.returnUrl = redirectSignURI
    viewRequest.authenticationMethod = 'none'

    viewRequest.email = user.email
    viewRequest.userName = `${user.firstName} ${user.lastName}`
    viewRequest.clientUserId = clientUserId

    return new Promise((resolve, reject) => {
      envelopesApi.createRecipientView(this.loginAccount.accountId, envelopeId, {recipientViewRequest: viewRequest},
        (error, recipientView, response) => {
          console.log('createRecipientView: ', error, recipientView)

          resolve(recipientView && recipientView.url)
        })
    }).then((url) => {
      return url
    })
  }

  async getEnvelopeUrl (user, transferId) {
    try {
      if(!transferId) {
        throw new Error();
      }
      await this.login(user)
      const url = await this.sendByFile(user, transferId)
      const filePath = config.pathToPdfFilesFolder + transferId + ".pdf"
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }


      console.log('Result: ', url)
      return url

    } catch (e) {
      console.log(e)
    }
  }

  async getMainSignUrl (user) {
    try {

      await this.login(user)
      const url = await this.sendByMainFile(user)
      const filePath = config.pathToPdfFilesFolder + user._id + ".pdf"
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }


      console.log('Result: ', url)
      return url

    } catch (e) {
      console.log(e)
    }
  }

  async downloadSignedDoc(user, envelopeId) {

    return new Promise(async (resolve, reject) => {
      const documentId = 1;
      let envelopesApi = new docusign.EnvelopesApi();
      if(!user || !envelopeId) {
        throw new Error();
      }

      await this.login(user);
      let accountId = this.loginAccount.accountId;

      envelopesApi.getDocument(accountId, envelopeId, documentId, null, async (error, document, response) => {
        if (error) {
          console.log('Error: ' + error);
          return;
        }
        if (document) {
          try {
            const fs = require('fs');
            const path = require('path');
            // download the document pdf
            const filename = config.pathToPdfFilesFolder +'/sign/'+ envelopeId + '.pdf';
            await fs.writeFileSync(filename, new Buffer(document, 'binary'));
            resolve(filename);
          } catch (ex) {
            console.log('Exception: ' + ex);
          }
        }
      });
    })

  }
}

export default new DocuSign()
