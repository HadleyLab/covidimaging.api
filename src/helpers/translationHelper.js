import fs from 'fs';
import Path from 'path';
import { LANGUAGE_EN } from '../constants'

export default (language, field) => {
    let lang = language ? language : LANGUAGE_EN;
    const translationsPath = Path.resolve(__dirname, `../translations/${lang}.json`);
    const translationFile = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
    return translationFile[field];
}
