import mongoose from '../../db';
const MigrationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
}, {usePushEach: true})

MigrationSchema.pre('save', async function (next) {
  const user = this
  user.updatedAt = Date.now
  return next()
})

/**
 * @typedef {Model} Migration
 */
export default mongoose.db.model('Migration', MigrationSchema);
