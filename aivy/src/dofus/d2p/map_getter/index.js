const fs = require('fs');
const path = require('path');
const read_map = require('./../map_reader');

const {dofus_reader} = require('../../io');

const get_map_from_id_async = async (id, folder_path, encryption_key=undefined) => {
    const buffer = await fs.promises.readFile(path.join(folder_path, `${id}.dlm`));
    const promise = new Promise(resolve => resolve(read_map_from_buffer(buffer, encryption_key)));
    return promise;
}

const get_map_from_id = (id, folder_path, encryption_key=undefined) => {
    try{
        const buffer = fs.readFileSync(path.join(folder_path, `${id}.dlm`));
        return read_map_from_buffer(buffer, encryption_key);
    } catch(error) {
        return {
            result: 'error',
            reason: error.message
        };
    }
}

const read_map_from_buffer = (buffer, encryption_key) => {
    if(encryption_key) return read_map(new dofus_reader(buffer), Buffer.from(encryption_key));
    return read_map(new dofus_reader(buffer));
}

module.exports = {
    get_map_from_id,
    get_map_from_id_async
};