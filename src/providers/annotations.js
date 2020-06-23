import Annotations from "../models/annotations";
import { HttpNotFoundError } from '../helpers/errors'


class AnnotationsProvider {

    /**
     * Create new Annotations
     *
     * @param {object} data
     *
     * @returns {Promise<Model|Aggregate|*>}
     */
    async create(data) {
        const annotation = new Annotations(
            {
                tag: data.tag,
                annotation: data.annotation
            }
        );
        await annotation.save();

        return annotation;
    }

    /**
     * Update Annotations
     *
     * @param {object} data
     *
     * @returns {Promise<Model|Aggregate|*>}
     */
    async update(data) {
        const annotation = Annotations.findOneAndUpdate(
            { _id: data._id },
            { $set: {
                    tag: data.tag,
                annotation: data.annotation,
                }
            },
            { new: true }, function(err, doc) {
            if (err) {
                throw new HttpNotFoundError();
            }
        });

        return annotation;
    }

    /**
     * Found and remove by _id
     *
     * @param {string} id =_id
     *
     * @returns {Promise<*>}
     */
    async delete(id) {
        let result = Annotations.findOne({_id:id}).remove();
        if (!result) {
            throw new HttpNotFoundError();
        }

        return result;
    }

    async get({id}) {
        if (id) {
            return await this.byID(id);
        } else {
            return await this.getList();
        }
    }

    /**
     * Return Annotations by ID
     *
     * @param id
     * @returns {Promise<*>}
     */
    async byID(id) {
        const annotation = await Annotations.findOne({_id:id}).populate('contactPerson');
        if (!annotation) {
            throw new HttpNotFoundError();
        }
        return annotation;
    }

    /**
     * Get all annotations
     *
     * @returns {Promise<*>}
     */
    async getList() {

        const annotation = await Annotations.find();

        if (!annotation) {
            throw new HttpNotFoundError();
        }

        return {
            annotations: annotation
        };
    }
}

export default new AnnotationsProvider();
