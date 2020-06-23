import mkdirp from 'mkdirp';
import fs from 'fs';
import path from 'path';
import Promise from "bluebird";
import imageSize from 'image-size';
const sizeOf = Promise.promisify(imageSize);

export default async (folder, filename, contents) => {
  mkdirp.sync(folder);
  fs.writeFileSync(path.join(folder, filename), fs.readFileSync(contents));
  try {
    const dimensions = await sizeOf(folder + '/' + filename);
  } catch (err) {
    return false;
  }
}
