const default_encryption_str = '649ae451ca33ec53bbcbcc33becf15f4';
const ELEMENT_TYPES_ENUM = {
    GRAPHICAL: 2,
    SOUND: 33
}

const ATOUIN_CONSTANTS = {
    MAP_WIDTH: 14,
    MAP_HEIGHT: 20,
    MAP_CELLS_COUNT: 560,
    CELL_WIDTH: 86,
    CELL_HALF_WIDTH: 43,
    CELL_HEIGHT: 43,
    CELL_HALF_HEIGHT: 21.5
}

const read_map = (reader, encryption_str=default_encryption_str) => {
    const encryption_key = Buffer.from(encryption_str);
    const map = {};
    
    map.header = reader.readByte();

    let data_len = 0;
    
    if(map.header !== 77) throw 'Unknown file header, first byte must be 77';

    map.version = reader.readByte();
    map.id = reader.readUnsignedInt();

    if(map.version >= 7){
        map.encrypted = reader.readBoolean();
        map.encrypted_version = reader.readByte();

        data_len = reader.readInt();

        if(map.encrypted){
            const encrypted_data = reader.readBytes(data_len);
            for(let i = 0;i<data_len;i++){
                encrypted_data[i] = encrypted_data[i] ^ encryption_key[i % encryption_key.length];
            }
            reader.clear();
            reader.add(encrypted_data);
        }
    }

    map.relative_id = reader.readUnsignedInt();
    map.position = read_world_point(map.relative_id);

    map.map_type = reader.readByte();
    map.subarea_id = reader.readInt();
    map.top_neighbour_id = reader.readInt();
    map.bottom_neighbour_id = reader.readInt();
    map.left_neighbour_id = reader.readInt();
    map.right_neighbour_id = reader.readInt();
    map.shadow_bonus_on_entities = reader.readUnsignedInt();

    if(map.version >= 9){
        map.color = reader.readInt(); // rgb
        map.grid_color = reader.readUnsignedInt(); // grid argb
    }else if(map.version >= 3){
        const bg_red = reader.readByte();
        const bg_green = reader.readByte();
        const bg_blue = reader.readByte();

        map.background = (bg_red & 255) << 16 | (bg_green & 255) << 8 | bg_blue & 255;  
    }

    if(map.version >= 4){
        map.zoom_scale = reader.readUnsignedShort() / 100;
        map.zoom_offset_x = reader.readShort();
        map.zoom_offset_x = reader.readShort();
    }
    
    if(map.version > 10){
        map.tactical_model_template_id = reader.readInt();
    }

    map.backgrounds_count = reader.readByte();
    map.background_fixtures = [];

    for(let i = 0;i<map.backgrounds_count;i++){
        map.background_fixtures[i] = read_fixture(reader);
    }

    map.foregrounds_count = reader.readByte();
    map.foreground_fixtures = [];

    for(let i = 0;i<map.foregrounds_count;i++){
        map.foreground_fixtures[i] = read_fixture(reader);
    }

    reader.readInt(); // just skip
    map.ground_crc = reader.readInt();
    map.layers_count = reader.readByte();
    map.layers = [];

    for(let i = 0;i<map.layers_count;i++){
        map.layers[i] = read_layer(reader, map.version);
    }

    map.cells_count = ATOUIN_CONSTANTS.MAP_CELLS_COUNT;
    map.cells = [];

    map.arrow_cells = [];
    let old_movement_system = false;;
    map.is_using_new_movement_system = false;
    for(let i = 0;i<map.cells_count;i++){
        const cell_data = read_cell_data(reader, map.version, i);
        map.cells[i] = cell_data;

        if(cell_data.left_arrow) map.arrow_cells[i] = 1;
        if(cell_data.right_arrow) map.arrow_cells[i] = 2;
        if(cell_data.top_arrow) map.arrow_cells[i] = 3;
        if(cell_data.bottom_arrow) map.arrow_cells[i] = 4;

        if(!old_movement_system){
            old_movement_system = cell_data.move_zone;
        }

        if(cell_data.move_zone !== old_movement_system){
            map.is_using_new_movement_system = true;
        }
    }

    return map;
}

const read_world_point = relative_id => {
    const result = {};

    result.map_id = relative_id;
    result.world_id = (relative_id & 1073479680) >> 18;

    result.x = relative_id >> 9 & 511;
    result.y = relative_id & 511;

    if((result.x & 256) === 256) result.x = -(result.x & 255);
    if((result.y & 256) === 256) result.y = -(result.y & 255);

    return result;
}

const read_fixture = reader => {
    const result = {};

    result.fixtureId = reader.readInt();

    const offset_x = reader.readShort();
    const offset_y = reader.readShort();

    result.offset = {
        x: offset_x,
        y: offset_y
    };

    result.rotation = reader.readShort();
    result.x_scale = reader.readShort();
    result.y_scale = reader.readShort();

    result.red_multiplier = reader.readByte();
    result.green_multiplier = reader.readByte();
    result.blue_multiplier = reader.readByte();

    result.hue = result.red_multiplier | result.green_multiplier | result.blue_multiplier;
    result.alpha = reader.readSignedByte();

    return result;
}

const read_layer = (reader, map_version) => {
    const result = {};

    result.layer_id = map_version >= 9 ? reader.readByte() : reader.readInt();
    result.cells_count = reader.readShort();

    result.cells = [];

    for(let i = 0;i<result.cells_count;i++){
        result.cells[i] = read_cell(reader, map_version);
    }

    return result;
}

const read_cell = (reader, map_version) => {
    const result = {};

    result.cell_id = reader.readShort();
    result.elements_count = reader.readShort();
    result.elements = [];

    for(let i = 0;i<result.elements_count;i++){
        const type = reader.readByte();
        result.elements[i] = read_element(reader, map_version, type);
    }

    return result;
}

const read_element = (reader, map_version, type) => {
    const result = {};
    
    switch(type){
        case ELEMENT_TYPES_ENUM.GRAPHICAL: 
            result.element_id = reader.readUnsignedInt();
            result.hue = color_multiplicator(reader.readByte(), reader.readByte(), reader.readByte());
            result.shadow = color_multiplicator(reader.readByte(), reader.readByte(), reader.readByte());

            if(map_version <= 4){
                const offset_x = reader.readByte();
                const offset_y = reader.readByte();

                result.offset = {
                    x: offset_x,
                    y: offset_y
                }

                result.pixel_offset = {
                    x: offset_x * ATOUIN_CONSTANTS.CELL_HALF_WIDTH,
                    y: offset_y * ATOUIN_CONSTANTS.CELL_HALF_HEIGHT
                }
            }else{
                const offset_x = reader.readShort();
                const offset_y = reader.readShort();

                result.pixel_offset = {
                    x: offset_x,
                    y: offset_y
                }

                result.offset = {
                    x: offset_x / ATOUIN_CONSTANTS.CELL_HALF_WIDTH,
                    y: offset_y / ATOUIN_CONSTANTS.CELL_HALF_HEIGHT
                }
            }

            result.altitude = reader.readByte();
            result.identifier = reader.readUnsignedInt();

            return result;
        case ELEMENT_TYPES_ENUM.SOUND: 
            result.sound_id = reader.readInt();
            result.base_volume = reader.readShort();
            result.full_volume_distance = reader.readInt();
            result.null_volume_distance = reader.readInt();
            result.min_delay_between_loops = reader.readShort();
            result.max_delay_between_loops = reader.readShort();
            return result;
        default: throw `invalid type in basic elements found : ${type}`;
    }
}

const read_cell_data = (reader, map_version, id) => {
    const result = {};
    result.id = id;
    result.floor = reader.readByte() * 10;

    if(result.floor !== -1280){
        if(map_version >= 9){
            const tmp_byte = reader.readShort();
            result.mov = (tmp_byte & 0x1) === 0;
            result.non_walkable_during_fight = (tmp_byte & 2) !== 0;
            result.non_walkable_during_RP = (tmp_byte & 4) !== 0;
            result.los = (tmp_byte & 8) === 0;
            result.blue = (tmp_byte & 16) !== 0;
            result.red = (tmp_byte & 32) !== 0;
            result.visible = (tmp_byte & 64) !== 0;
            result.farm_cell = (tmp_byte & 128) !== 0;

            if(map_version >= 10){
                result.haven_bag_cell = (tmp_byte & 256) !== 0;
                result.top_arrow = (tmp_byte & 512) !== 0;
                result.bottom_arrow = (tmp_byte & 1024) !== 0;
                result.right_arrow = (tmp_byte & 2048) !== 0;
                result.left_arrow = (tmp_byte & 4096) !== 0;
            }else{
                result.top_arrow = (tmp_byte & 256) !== 0;
                result.bottom_arrow = (tmp_byte & 512) !== 0;
                result.right_arrow = (tmp_byte & 1024) !== 0;
                result.left_arrow = (tmp_byte & 2048) !== 0;
            }
        }else{
            const losmov = reader.readSignedByte();
            result.los = (losmov & 2) >> 1 === 1;
            result.mov = (losmov & 1) === 1;
            result.visible = (losmov & 64) >> 6 === 1;
            result.farm_cell = (losmov & 32) >> 5 === 1;
            result.blue = (losmov & 16) >> 4 === 1;
            result.red = (losmov & 8) >> 3 === 1;
            result.non_walkable_during_RP = (losmov & 128) >> 7 === 1;
            result.non_walkable_during_fight = (losmov & 4) >> 2 === 1;
        }

        result.speed = reader.readByte();
        result.map_change_data = reader.readByte();

        if(map_version > 5){
            result.move_zone = reader.readSignedByte();
        }

        result.has_linked_zone_fight = result.mov && !result.non_walkable_during_fight && !result.farm_cell && !result.haven_bag_cell;
        result.has_linked_zone_rp = result.mov && !result.farm_cell;

        if(map_version > 10 && (result.has_linked_zone_fight || result.has_linked_zone_rp)){
            result.linked_zone = reader.readSignedByte();
        }

        if(map_version > 7 && map_version < 9){
            const tmp_byte = reader.readByte();
            result.arrow = 15 & tmp_byte;
        }
    }

    return result;
}

const color_multiplicator = (red, green, blue, is_one = false) => {
    const result = {
        red,
        green,
        blue,
        is_one
    };

    if(!is_one && red + green + blue === 0){
        result.is_one = true;
    }

    return result;
}

module.exports = read_map;