import request from 'request'
//import jwt from 'jsonwebtoken'
import config from '../config'
//
// jwt.sign({service: 'api'}, config.jwtSecret, {algorithm: 'RS256'}, function (err, token) {
// })
export const getUrl = (url) => `${config.encoderUrl}${url}`

export const getHeaders = () => ({
  'Authorization': `Bearer ${config.jwtEncryptToken}`,
})

const getRequestObject = (url, param, options) => ({
  url: getUrl(url),
  headers: getHeaders(),
  body: param,
  ...options,
})
const getRequestObjectFormData = (url, param, options) => ({
  url: getUrl(url),
  headers: getHeaders(),
  formData: param,
  ...options,
})
const resultCallBack = (resolve, reject) => (error, response, body) => {
  let result = body
  try {
    result = JSON.parse(body)
  } catch (e) {}
  let err = error || result && result.error
  if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
    return reject(err)
  }
  return resolve(result)
}

export const post = (url, param, options) => new Promise(
  (resolve, reject) => {
    return request.post(getRequestObject(url, param, options), resultCallBack(resolve, reject))
  })

export const upload = (url, param, options) => new Promise(
  (resolve, reject) => {
    return request.post(getRequestObjectFormData(url, param, options), resultCallBack(resolve, reject))
  })

export const put = (url, param) => new Promise((resolve, reject) => {
  request.put(getRequestObject(url, param), resultCallBack(resolve, reject))
})
export const get = (url) => new Promise((resolve, reject) => {
  request.get(getRequestObject(url, undefined, {json: true}), resultCallBack(resolve, reject))
})
