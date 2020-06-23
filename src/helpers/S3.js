import AWS from 'aws-sdk'
import fs from 'fs'
import config from '../config'
import logger from '../helpers/logger'


export const initAws = () => {
  AWS.config.update({
    region: config.aws.s3.region,
    credentials: config.aws.s3
  });

  return new AWS.S3({params: {Bucket: config.aws.s3.bucket, signatureVersion: 'v4'}})
}

export const uploadToS3 = ({bucketPath, filePath}) =>
  new Promise((resolve, reject) => {
    const s3Bucket = initAws()
    const data = {Key: bucketPath, Body: fs.createReadStream(filePath)}
    s3Bucket.upload(data, (aerr) => {
      if (aerr) {
        return reject(aerr)
      }
      const url = `https://${config.aws.s3.bucket}.s3.amazonaws.com/${bucketPath}`;
      return resolve({url})
    })
  })

export const removeFromS3 = ({bucketPath}) =>
  new Promise((resolve, reject) => {
    const s3Bucket = initAws()
    const data = {Key: bucketPath}
    s3Bucket.deleteObject(data, (aerr) => {
      if (aerr) {
        return reject(aerr)
      }
      return resolve()
    })
  })

export const getSignedUrlS3 = (({url, type}) =>
{
  return new Promise(async (resolve, reject) => {
    const s3Bucket = initAws()
    const params = {
      Bucket: config.aws.s3.bucket,
      Key: url.replace(/^(http|https)\:\/{2}[a-z0-9\-\.]*\/{1}/, ''),
      ResponseExpires: +new Date()+5*24*60*60*1000,
      Expires: 6*24*60*60,
    }

    switch (type) {
      case 'png':
        params.ResponseContentType = 'image/png'
        break;

      case 'jpeg':
        params.ResponseContentType = 'image/jpeg'
        break

      case 'pdf':
        params.ResponseContentType = 'application/pdf'
        break

      default:
        params.ResponseContentType = 'image/jpeg'
        break
    }

    // console.log(params)

    await s3Bucket.getSignedUrl('getObject', params, function (err, bucketUrl) {
      if (err) {
        logger.error(err)
        return reject(err)
      }
      logger.info(bucketUrl)
      return resolve(bucketUrl)
    })
  })
})
