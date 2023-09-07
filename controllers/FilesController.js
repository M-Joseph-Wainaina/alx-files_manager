import userUtils from "../utils/user";
import Queue from "bull";

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const filesQueue = new Queue('filesQueue');

class FilesController {
    //post file should create a file both locally and in Db
    /*
     * Retrieve user based on token else unauthorized
     * to create a file must specify { 
     *  name: , type: "eg file, image folder",
     *  parentId: "default to zero if not given and must be parent of type folder",
     *  isPublic: "defaults to false"
     *  data: 'only for type image and file and is base64 of the data'
     * }
     * all files will be stored locally in a folder path = FOLDER_PATH
     * create a local path in storing folder with filename a uuid
     * store data in base64
     * new document in collection users contains the fields
     * { userId: owner of the file, name: same value as recieved, 
     * type: , isPublic: ,parentId: ,
     * localPath: for type Image or file }
     */

    static async postUpload(request, response) {
        //get user id
        const { userId } = userUtils.getUserIdAndKey(request);

        if (!userId) return response.status(401).send( {error: "Unauthorized"} );


    }
}