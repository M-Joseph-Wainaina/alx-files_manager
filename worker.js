import Queue from 'bull';
import basicUtils from './utils/basic';
import fileUtils from './utils/file';
import { ObjectId } from 'mongodb';
import { promises as fspromises } from 'fs';


const imageThumbnail = require('image-thumbnail');

const fileQueue = new Queue('filesQueue');
console.log('generating image thumbnails');


fileQueue.process(async (job) => {
    const {fileId , userId } = job.data;

    if (!userId) { 
        console.log('Missing userId');
        throw new Error ("Missing userId");
    }
    
    if (!fileId) {
         console.log('Missing fileId');
         throw new Error ('Missing fileId')
    }

    if (
        (!basicUtils.isValidId(fileId)) ||
        (!basicUtils.isValidId(userId))
    ) throw new Error ('File not found');

    const file = await fileUtils.getFile({
        _id: ObjectId(fileId),
    });

    const { localPath } = file;

    const options = {};

    const width = [500, 250, 100];

    width.forEach(async (width) => {
        options.width = width;
        try {
            const thumbnail = await imageThumbnail(localPath, options);
            await fspromises.writeFile(`${localPath}_${width}`, thumbnail);
        } catch (err) {
            console.error(err.message);
        }
    });

});