const path = require('path');

const parser = require('../../../dofus/botofu');
const create_protocol = require('../../../dofus/protocol');
const parse_d2p = require('../../../dofus/d2p/map_parser');

module.exports = (server) => {
    console.log('Dofus MITM started');
    const protocol_name = `dofus_protocol_${server.server_title}.json`;
    const map_folder_path = path.join(__dirname, `./dofus_map_${server.server_title}`);

    if(server['server_dofus_invoker']){
        parser(server['server_dofus_invoker'], __dirname, protocol_name, () => {
            server.dofus_protocol = create_protocol(__dirname, protocol_name);
            console.log(`Protocol ${['server_dofus_invoker']} parsed`);
        });
    }

    if(server['server_dofus_map']){
        parse_d2p(server['server_dofus_map'], map_folder_path).then(_ => {
            server.dofus_map = map_folder_path;
            console.log(`Map ${server['server_dofus_map']} parsed`);
        });
    }
}
