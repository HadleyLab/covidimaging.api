import { HttpUnprocessableEntityError } from './errors'

export default (error) => {
  return new HttpUnprocessableEntityError('error', {error:{key: 'error', message: error, type: 'error'}})
}
