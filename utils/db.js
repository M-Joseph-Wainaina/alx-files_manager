import { MongoClient } from 'mongodb';
import Db from 'mongodb/lib/db';
import { promisify } from 'util';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

class DBClient{
    constructor()
    {

        MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
            if (!err) {
                //connected to the server successfully
                this.db = client.db(database);

                this.usersCollection = this.db.collection('users');
                this.filesCollection = this.db.collection('files');
            } else {
                console.log(err.message);
                this.db = false;
            }
        });
        
    }

    /*
     * return true when connection to mongodb is succesful
     */

    isAlive(){

        return Boolean(this.db);

    }

    /*
     * return the number of users
     */

    async nbUsers(){
        const numberOfUsers = this.usersCollection.countDocuments();
        return numberOfUsers;
    }

    /*
     * return the number of documents in the collection files
    */

    async nbFiles(){
        const numberOfFiles = this.filesCollection.countDocuments();
        return numberOfFiles;
    }
}

const dbClient = new DBClient();

export default dbClient;