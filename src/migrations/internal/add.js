const fs = require('fs')
const path = require('path')
const tracer = require('tracer')
const logger = tracer.colorConsole()

const twoSign = (str) => {
  return ('00' + str).substr(-2)
}

const dateString = () => {
  const dt = new Date()
  return [dt.getFullYear(), twoSign(dt.getMonth() + 1), twoSign(dt.getDate())].join('-') + '_'
    + [twoSign(dt.getHours()), twoSign(dt.getMinutes()), twoSign(dt.getSeconds())].join('-')
}

const add = async (name) => {
  if (!name) {
    logger.error('npm run migration add {name} - please specify name of migration')
    process.exit(1)
  }
  const fileName = `${dateString()}-${name}.js`
  const content = `/*
  import something
  
  very important migration should return true
 */
export default async () => {
  return true
}
`
  fs.writeFileSync(path.join(__dirname, '..', fileName), content)
  logger.info(`migration ${fileName} was successfully added`)
}

const init = async () => {
  const command = `${process.argv && process.argv[2]}`.toLowerCase()
  console.log(command)
  if(command!=='add'){
    throw `${command} command not support. please use command 'add'`
  }
  return await add(process.argv[3])
}

init().then(() => {
  process.exit()
}).catch((e) => {
  logger.error(e)
  process.exit(1)
})
