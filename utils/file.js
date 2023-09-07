import dbClient from "./db";
import basicUtils from "./basic";
import { v4 as uuidv4 } from 'uuid';
import { promises as fspromises } from 'fs';
import { ObjectId } from 'mongodb';


const fileUtils = {
    
     async validateBody(request) {

        const { name, type, isPublic = false, data } = request.body;

        let { parentId = 0 } = request.body;
        
        const typesAllowed = [ 'image', 'folder', 'file' ];

        let msg = null;

        if (parentId === '0') parentId = 0;

        if (!name) msg = 'Missing name';
        else if (!type || !typesAllowed.includes(type)) msg = 'Missing type';
        else if (!data && type !== 'folder') msg = 'Missing data';
        else if (parentId && parentId !== '0') {
            let file;

            if (basicUtils.isValidId(parentId)) {
                file = await this.getFile(
                    {_id: Objectid(parentId)}
                )
            }
            else file = null;

            if (!file) {
                msg = "Parent not found";
            }
            else if (file.type !== 'folder'){
                msg = "Parent not a folder";
            }
        }

        const obj = {
            error: msg,
            fileParams: {
                name,
                type,
                parentId,
                isPublic,
                data,
            },
        };

        return obj;

    },

    async getFile(query) {
        const file = await dbClient.filesCollection.findOne(query);
        return file;
    },

    async saveFile(userId, fileParams, FOLDER_PATH ) {
        console.log(userId, fileParams, FOLDER_PATH);
        const { name, type, isPublic, data } = fileParams;

        let { parentId } = fileParams;

        if ( parentId !== 0 )parentId = Objectid(parentId);
        
        const query = {
            userId: ObjectId(userId),
            name,
            type,
            isPublic,
            parentId,
        };

        if (fileParams.type !== 'folder') {
            const filenameUUID = uuidv4();

            const filesDataDocoded = Buffer.from(data, 'base64');

            const path = `${FOLDER_PATH}/${filenameUUID}`;

            query.localPath = path;

            try {
                await fspromises.mkdir(FOLDER_PATH, {recursive: true});
                await fspromises.writeFile(path, filesDataDocoded);
            } catch (err) {
                return {error: err.message, code: 400 };

            }

            const result = await dbClient.filesCollection.insertOne(query);

            const file = this.processFile(query);

            const newFile = {id: result.insertedId, ...file};

            return {error: null, newFile};

        }

    },

    processFile(doc){
        const file = { id: doc._id, ...doc};

        delete file.localPath;
        delete file._id;

        return file;
    },
    
}

export default fileUtils;