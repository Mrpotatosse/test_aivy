const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');
const path = require('path');

const create_protocol = (location, protocol_name) => {
    return new JsonDB(new Config(path.join(location, protocol_name), true, true, '/'));
}

module.exports = create_protocol;