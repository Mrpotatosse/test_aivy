const { app, start_http } = require('../server/http');

require('./servers')(app); // add servers requests
require('./launch')(app); // add launch requests
require('./scripts')(app); // add scripts requests

require('./dofus/characters')(app); // add dofus requests

module.exports = () => {
    return start_http();
}