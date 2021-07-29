const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const {dofus_reader} = require('../../io');

const read_files = async (folder_path, extension, file_callback) => {
    const files = await fs.promises.readdir(folder_path);

    files
    .filter(file => file.endsWith(`.${extension}`))
    .forEach(async file => {
        const file_location = path.join(folder_path, file);

        await file_callback(file_location);
    });
}

const read_d2p_file = async (file_location, buffer_callback) => {
    const file_buffer = await fs.promises.readFile(file_location);
        
    const file_reader = new dofus_reader(file_buffer);

    const param1 = file_reader.readByte();
    const param2 = file_reader.readByte();

    if((param1 !== 2) || (param2 !== 1)) throw 'invalid d2p file';

    file_reader.setPosition(file_reader.dataLength() - 24);

    const data_offset = file_reader.readUnsignedInt();
    const data_count = file_reader.readUnsignedInt();
    const index_offset = file_reader.readUnsignedInt();
    const index_count = file_reader.readUnsignedInt();

    const properties_offset = file_reader.readUnsignedInt();
    const properties_count = file_reader.readUnsignedInt();

    file_reader.setPosition(index_offset);

    const files = {};
    const properties = {}

    for(let i = 0;i<index_count;i++){
        const file_name = file_reader.readUTF();

        const offset = file_reader.readInt();
        const length = file_reader.readInt();

        files[file_name] = {
            offset: offset + data_offset,
            length: length
        };
    }

    file_reader.setPosition(properties_offset);
    for(let i = 0;i<properties_count;i++){
        const property_name = file_reader.readUTF();
        const property_value = file_reader.readUTF();

        properties[property_name] = property_value;
    }

    Object.keys(files).map(name => {
        file_reader.setPosition(files[name].offset);
        files[name].compressed_data = file_reader.readBytes(files[name].length);   
    });

    file_reader.clear();
    await read_dlm_files(files, buffer_callback);
}

const read_dlm_files = async (dlms, buffer_callback) => {
    Object.keys(dlms).map(key => {
        const dlm = dlms[key];
        
        zlib.inflate(dlm.compressed_data, (err, buff) => {
            if(!err){
                const output_path = path.join(__dirname, './map_output');
                const file_id = key.split('/')[1];

                buffer_callback(file_id, buff);
            }
        });
    });
}

const parse_d2p = async (d2p_location, output_location) => {
    await fs.promises.mkdir(output_location, { recursive: true });

    const read_d2p_file_aux = async location => {
        read_d2p_file(location, (file, buffer) => {
            fs.promises.writeFile(path.join(output_location, file), buffer);
        });
    }

    await read_files(d2p_location, 'd2p', read_d2p_file_aux);
}

module.exports = parse_d2p;