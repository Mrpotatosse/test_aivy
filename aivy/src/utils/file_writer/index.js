const fs = require('fs');
const util = require('util');
const path = require('path');

const writeFile = util.promisify(fs.writeFile);

/**
 * 
 * @param {string} file_path 
 * @param {string} start_path 
 * @param {object} content
 * @param {string} encoding 
 */
const write_file_json_async = async (file_path, start_path, content) => {
    await writeFile(path.join(start_path, file_path), JSON.stringify(content, null, '\t'));
}

module.exports = {
    write_file_json_async
}