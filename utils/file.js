import dbClient from "./db";
import basicUtils from "./basic";
import { v4 as uuidv4 } from 'uuid';
import { promises as fspromises } from 'fs';
import { ObjectId } from 'mongodb';
import userUtils from "./user";


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
      
        const { name, type, isPublic, data } = fileParams;

        let { parentId } = fileParams;

        if ( parentId !== 0 )parentId = ObjectId(parentId);
        
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
        }
            
        const result = await dbClient.filesCollection.insertOne(query);

        const file = this.processFile(query);

        const newFile = {id: result.insertedId, ...file};

        return {error: null, newFile};

        

    },

    processFile(doc){
        const file = { id: doc._id, ...doc};

        delete file.localPath;
        delete file._id;

        return file;
    },

    async getFilesOfParentId(pipeline) {
       
        const filesList = await dbClient.filesCollection.aggregate(pipeline);

        return filesList;
    }, 

    async publishUnpulish(request, setPublish ){
        const {id: fileId } = request.params;

        if (!basicUtils.isValidId(fileId)) { return { error: 'Unauthorized', code: 401 }; }

        const { userId } = await userUtils.getUserIdAndKey(request);

        if (!basicUtils.isValidId(userId)) { return { error: 'Unauthorized', code: 401}; }

        const user = await userUtils.getUser({
            _id: ObjectId(userId),
        });

        if (!user) { return {error: 'Unauthorized', code: 401 }; }

        const file = await this.getFile({
            _id: ObjectId(fileId),
            userId: ObjectId(userId),
        });

     
     

        if (!file) return { error: 'Not found', code: 404 };

        const result = await this.updateFile(
            {
                _id: ObjectId(fileId),
                userId: ObjectId(userId),
            },
            { $set: { isPublic: setPublish } },
        
        );

        

        const {
             _id: id,
             userId: resultUserId,
             name,
             type,
             isPublic,
             parentId,
        } = result.value;

        const updatedFile = {
            id,
            userId: resultUserId,
            name,
            type,
            isPublic,
            parentId,
        };

        return {error: null, code: 200, updatedFile };
    },

    /**
     * @query {obj} query to find document to update
     * @set {obj} object with query info to update in mongo
     * @return {object} updated file
     */

    async updateFile(query, set) {
        const fileList = await dbClient.filesCollection.findOneAndUpdate(
            query,
            set,
            { returnOriginal: false},
        );
        return fileList;
    },

    isOwnerAndIsPublic(file, userId){
        if(
            ( !file.isPublic && !userId ) ||
            ( userId && file.userId.toString() !== userId && !file.isPublic )
        ) { return false }
        
        return true;
    },

    async getData(file, size) {
        let { localPath } = file;
        let data;

        if (size) localPath = `${localPath}_${size}`;

        try {
           data = await fspromises.readFile(localPath);
        } catch (error) {
            return {error: 'Not found', code: 404};
        }

        return { data };

    },
            
};

export default fileUtils;