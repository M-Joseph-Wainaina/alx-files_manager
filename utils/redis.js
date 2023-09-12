import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
    constructor()
    {
        this.client = redis.createClient();
        this.getAsync = promisify(this.client.get).bind(this.client);

        this.client.on('error', (err) => {
            console.log(`Redis client not connected to the server:`, err.toString());
        });
        this.client.on('connect', () => {} );
        
    }
    /*
    * Checks if connection to Redis is Alive
    * @return {boolean} true if connection alive or false if not
    */
    
    isAlive() {
        return this.client.connected;
    }
    /*
     * return a value for a given key
     * @return (str) value stored in server for  key
    */

    async get(key){
        const value = await this.getAsync(key);
        return value;
    }

    /*
     * set a value with expireation
     * @key (str) key to value
     * @value (str) value to store
     * @duration (number) time to live TTL of key
     * @return undefined no return 
     */

    async set(key, value, duration){
        this.client.setex(key, duration, value);

    }

    /*
     * delete a key value pair in redis server
     * @key {string} key to delete from server
     * @return {undefined}
     */

    async del(key){
        this.client.del(key);
    }
}

const redisClient = new RedisClient();
export default redisClient;