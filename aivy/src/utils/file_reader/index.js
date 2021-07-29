const fs = require('fs');
const util = require('util');
const path = require('path');

const readFile = util.promisify(fs.readFile);

/**
 * 
 * @param {string} file_path
 * @param {string} start_path 
 * @param {string} encoding
 * 
 * @return {string} 
 */
const read_file_async = async (file_path, start_path, encoding=undefined) => {
    try{
        return await readFile(path.join(start_path, file_path), encoding);
    }catch(e){
        return e.message;
    }
}

/**
 * 
 * @param {string} file_path
 * @param {string} start_path
 * 
 * @return {object}
 */
const read_const_json = (file_path, start_path) => {
    try{
        const json_file = require(`${path.join(start_path, file_path)}`);
        return json_file;
    }catch(e){
        return {
            error: e.message
        }
    }
}

/**
 * 
 * @param {string} file_path
 * @param {string} start_path
 * 
 * @return {object}
 */
const read_mod_json_async = async (file_path, start_path) => {
    try{
        return JSON.parse(await read_file_async(file_path, start_path, 'utf-8'));
    }catch(e){        
        return {
            error: e.message
        }
    }
}

/**
 * 
 * @param {string} file_path
 * @param {string} start_path
 * 
 * @return {object}
 */
const read_mod_json = (file_path, start_path) => {
    try{
        return JSON.parse(fs.readFileSync(path.join(start_path, file_path), {
            encoding: 'utf-8'
        }));
    }catch{
        return {
            error: e.message
        }
    }
}

module.exports = {
    read_file_async,
    read_const_json,
    read_mod_json_async,
    read_mod_json
}