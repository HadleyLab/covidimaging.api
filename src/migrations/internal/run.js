import requireAll from 'require-all'
import path from 'path'
import tracer from 'tracer'
import Migration from './migrationModel'

const logger = tracer.colorConsole()
const run = async () => {
  const migrations = requireAll({
    dirname:path.join(__dirname, '..'),
    excludeDirs:/^\.(internal)$/,
    recursive: false
  })
  const migrationList = Object.keys(migrations).sort()

  for (const key of migrationList) {
    const migrate = await Migration.findOne({key})
    try {
      if (!migrate && await migrations[key]()) {
        logger.info(`success migration ${key}`)
        const newMigrate = new Migration()
        newMigrate.key = key
        await newMigrate.save()
      }
    } catch (e) {
      logger.error(`FAIL MIGRATION ${key}`, e)
    }

  }
}

run().then(() => {
  console.info('Migrations DONE')
  process.exit()
}).catch((e) => {
  console.log('migrations error', e)
  process.exit(1)
})
