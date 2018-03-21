// var global_vars = require('global_vars')();
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Game.rooms[room_name].memory.global_vars;
var my_spawn = Game.spawns[global_vars.spawn_name];
var my_room = Game.rooms[global_vars.room_name];

function get_direction_name(dx, dy) {
    if (dx == 0 && dy < 0) return TOP;
    else if (dx > 0 && dy < 0) return TOP_RIGHT;
    else if (dx < 0 && dy < 0) return TOP_LEFT;
    else if (dx == 0 && dy > 0) return BOTTOM;
    else if (dx > 0 && dy > 0) return BOTTOM_RIGHT;
    else if (dx < 0 && dy > 0) return BOTTOM_LEFT;
    else if (dx > 0 && dy == 0) return RIGHT;
    else if (dx < 0 && dy == 0) return LEFT;
    else return -1;
}

function get_stright_path(FromPos, ToPos) {
    /* Return path left-right or top-bottom
     FromPos, ToPos - RoomPosition (new RoomPosition(spawn_pos.x+1,spawn_pos.y-1,my_room.name))
     Return:
     Path: [{"x":18,"y":24,"dx":1,"dy":-1,"direction":2},
     {"x":18,"y":23,"dx":0,"dy":-1,"direction":1}]
     Empty path if any error has occurred}
     */
    if (typeof FromPos == "undefined" || typeof ToPos == "undefined") return [];
    var startx =  FromPos.x;
    var starty = FromPos.y;
    var endx = ToPos.x;
    var endy = ToPos.y;
    if (FromPos.x > ToPos.x || Frompos.y > ToPos.x) {
        startx =  ToPos.x;
        starty = ToPos.y;
        endx = FromPos.x;
        endy = FromPos.y;
    }
    var stright_path = [];
}

var room_helpers = {
    check_create_miner: function(room_name, spawn_name, units) {
        let my_room = Game.rooms[room_name];
        let my_spawn = Game.spawns[spawn_name];
        let cur_creeps = Game.creeps ? Game.creeps : {};
        let exist_miners = {};
        let create_miner = false;   // ID of container that need a new creep
        for (let creep_name in cur_creeps) {
            if (units[room_name][cur_creeps[creep_name].memory.role] == 'miner')
                if (typeof exist_miners[cur_creeps[creep_name].memory.container] === 'undefined')
                    if (cur_creeps[creep_name].ticksToLive < my_room.memory.global_vars.age_to_recreate_miner) {
                        create_miner = cur_creeps[creep_name].memory.container_id;
                        break;
                    } else exist_miners[cur_creeps[creep_name].memory.container] = true;
        }

        console.log('[DEBUG] (room_helpers.check_create_miner): create_miner: ' + create_miner);

        if (create_miner) {
            // Do nothing
        } else {// Check if no miners exist
            let containers_w_miners = Object.keys(exist_miners);
            let source_containers = Object.keys(my_room.memory.energy_flow.containers.source);
            for (let ci=0;ci<source_containers.length;ci++) {
                console.log('[DEBUG] (room_helpers.check_create_miner): Container: ' + source_containers[ci] + '; Total: ' + Object.keys(my_room.memory.energy_flow.containers.source));
                if (!containers_w_miners.includes(source_containers[ci])) {
                    create_miner = source_containers[ci];
                    break;
                }
            }
        }
        my_spawn.memory.general['create_miner'] = create_miner;
    },
    transfer_link2link: function(room_name) {
        source_link = Game.getObjectById(Game.rooms[room_name].memory.energy_flow.links.source)
        destination_link = Game.getObjectById(Game.rooms[room_name].memory.energy_flow.links.controller)
        if ( source_link && (source_link.energy > 100) && destination_link && (destination_link.energy/destination_link.energyCapacity < 0.9)) {
            let dst_missing = destination_link.energyCapacity - destination_link.energy;
            let energy2transfer = ((dst_missing < source_link.energy) ? dst_missing : source_link.energy);
            source_link.transferEnergy(destination_link, energy2transfer);
        }

    },
    upgrade_energy_flow: function(room_name) {
        // Containers
        let all_containers = Game.rooms[room_name].find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_CONTAINER)});
        let all_continers_ids = all_containers.map(x => x.id);
        let all_links = Game.rooms[room_name].find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LINK)});
        let all_links_ids = all_links.map(x => x.id);
        let all_sources = Game.rooms[room_name].memory.energy_flow.sources;
        let energy_flow_obj = Game.rooms[room_name].memory.energy_flow;
        let local_energy_flow_obj = {containers: {source :{}}};
        // Sort containers
        // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): All Containers: ' + JSON.stringify(all_containers.map(x => x.id)));

        for (let i = 0; i < all_containers.length; i++) {
            let container_defined = !((typeof energy_flow_obj.containers.controller[all_containers[i].id] === 'undefined') || (typeof energy_flow_obj.containers.source[all_containers[i].id] === 'undefined'));
            if (!container_defined)
                if (all_containers[i].pos.getRangeTo(Game.rooms[room_name].controller) < 5) {
                    energy_flow_obj.containers.controller[all_containers[i].id] = Game.rooms[room_name].controller;
                    container_defined = true
                } else {
                    for (let j = 0; j < all_sources.length; j++) {
                        if (all_containers[i].pos.getRangeTo(Game.getObjectById(all_sources[j])) === 1) {
                            energy_flow_obj.containers.source[all_containers[i].id] = all_sources[j];
                            container_defined = true;
                            // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Added Container: ' + all_containers[i].id + '; Source: ' + JSON.stringify(energy_flow_obj));
                            break;
                        }
                    }
                }
            // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Container: ' + all_containers[i].id + ' is Defined: ' + container_defined);
            if (!container_defined && (typeof energy_flow_obj.containers.other[all_containers[i].id] === 'undefined')) energy_flow_obj.containers.other[all_containers[i].id] = false;
        }

        // Delete missing containers IDs
        let containers_types = Object.keys(energy_flow_obj.containers);
        for (let ct = 0; ct < containers_types.length; ct++) {
            let current_containers_ids = Object.keys(energy_flow_obj.containers[containers_types[ct]]);
            // console.log('[DEBUG](room_helpers.upgrade_energy_flow): Types: ' + JSON.stringify(containers_types) + '; Idx: ' + ct + '; Containers: ' + JSON.stringify(energy_flow_obj.containers[containers_types[ct]]) + '; IDs: ' + current_containers_ids.length);
            for (let i = 0; i < current_containers_ids.length; i++) {
                let pretendet2remove = current_containers_ids[i];
                if (!all_continers_ids.includes(pretendet2remove)) {
                    console.log('[INFO] (room_helpers.upgrade_energy_flow): REMOVING missing container: ' + pretendet2remove);
                    delete energy_flow_obj.containers[containers_types[ct]][pretendet2remove];
                }
            }
        }

        // Links
        // console.log('[DEBUG](room_helpers.upgrade_energy_flow): All links: ' + all_links.length);
        for (let i=0;i<all_links.length;i++) {
            let link_defined = !((typeof energy_flow_obj.links.controller[all_links[i].id] === 'undefined') || (typeof energy_flow_obj.links.source[all_links[i].id] === 'undefined'));
            if (!link_defined) {
                // console.log('[DEBUG](room_helpers.upgrade_energy_flow): ID: ' + all_links[i].id + '; To Controller: ' + all_links[i].pos.getRangeTo(Game.rooms[room_name].controller));
                if (all_links[i].pos.getRangeTo(Game.rooms[room_name].controller) < 5) {
                    energy_flow_obj.links.controller = all_links[i].id;
                } else energy_flow_obj.links.source = all_links[i].id;
            }
        }

        // Delete missing Links IDs
        let links_types = Object.keys(energy_flow_obj.links);
        for (let lt = 0; lt < links_types.length; lt++) {
            if (!all_links_ids.includes(energy_flow_obj.links[links_types[lt]])) {
                energy_flow_obj.links[links_types[lt]] = false;
                console.log('[INFO] (room_helpers.upgrade_energy_flow): REMOVING missing LINK near ' + links_types[lt]);
            }
        }
        // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): ENERGY Flow: ' + JSON.stringify(energy_flow_obj));
        Game.rooms[room_name].memory.energy_flow = energy_flow_obj;
    },
    define_room_status: function(room_name) {
        let hostile_creeps = Game.rooms[room_name].find(FIND_HOSTILE_CREEPS);
        if (hostile_creeps && hostile_creeps.length > 0 && Game.spawns[spawn_name].memory.general.status === 'peace') {
            Game.spawns[spawn_name].memory.general.status = 'war';
            Game.notify('WE are attacked from (' + hostile_creeps[0].pos.x + ',' + hostile_creeps[0].pos.y + '); Body: ' + JSON.stringify(hostile_creeps[0].body));
        } else if (Game.spawns[spawn_name].memory.general.status === 'war' && !Game.spawns[spawn_name].memory.general.finish_war) {
            Game.spawns[spawn_name].memory.general.finish_war = Game.time + Game.rooms[room_name].memory.global_vars.update_period.after_war;
            console.log('[DEBUG] (main) Define finish war to ' +  (Game.time + Game.rooms[room_name].memory.global_vars.update_period.after_war))
        } else if (Game.spawns[spawn_name].memory.general.finish_war < Game.time && Game.spawns[spawn_name].memory.general.status === 'war') {
            Game.spawns[spawn_name].memory.general.status = 'peace';
            Game.spawns[spawn_name].memory.general.finish_war = false;
            Game.notify('It"s time for PEACE');
        }
    },
    get_energy_source_target: function() {
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_CONTAINER && (object.store/object.storeCapacity) > 0.3)});

        //targets.contact()
    },
    get_transfer_target: function() {
//        let towers = my_room.find(FIND_MY_STRUCTURES, {filter: object => (structureType: STRUCTURE_TOWER && object.energy < object.energyCapacity)});
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType != STRUCTURE_SPAWN && object.energy < object.energyCapacity)});
        //targets.sort((a,b) => a.hits - b.hits);
        targets.push(my_spawn);
        //if (targets[0]) console.log('[DEBUG] (room_helpers-get_transfer_target): Transfer target type: ' + targets[0].structureType);
        my_room.memory.targets.transfer = targets[0] ? targets[0].id : false;
        return targets[0].id
    },
    get_repair_defence_target: function() {
        avoid_stricts = ['5a3c93c377eddf3fcd2289e4', '5a4a8d9320171220b29bfbab', '5a3c9af47739a911457f0943', '5a4235091752005a72e4bf72', '5a3c8b5bf0d6a259c0ea8758', '5a3c8b3ea0bbf83fe1d871b7',
            '5a434aad352f7c7e6c4b88d1', '5a437edae9ad370d6f80c979', '5a436eb786a4a36e5af6c89e', '5a436c93b5b012359cb81bd2', '5a436bb28ee5032e65a12834', '5a4365fd262eb037220fc9b4',
            '5a4364e3eba40146402df274', '5a4364e3eba40146402df274', '5a4361ecb458c9595ccdf3b7', '5a435fd9176c8f376528dbb8'];
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax && avoid_stricts.indexOf(object.id) === -1});
        targets.sort((a,b) => a.hits - b.hits);
//        console.log('[DEBUG] (get_repair_defence_target): targets: ' + JSON.stringify(targets));
        my_room.memory.targets.repair_defence = targets[0] ? targets[0].id : false;
    },
    get_repair_civilianl_target: function() {
        var targets = my_room.find(FIND_STRUCTURES, {filter: object => !(object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax});
        targets.sort((a,b) => a.hits - b.hits);
        my_room.memory.targets.repair_civilian = targets[0] ? targets[0].id : false;
    },
    get_build_targets: function() {
        // Extensions have highest priority
        var targets = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});
        // Defence structures are secondary priority
        if (targets) targets = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER)});
        // All other structures
        if (targets) targets = (my_room.find(FIND_CONSTRUCTION_SITES) || []);
        // Sort targets by close to spawn
        let closest_obj = targets[0];
        if (closest_obj) {
            let closest_obj_range = Math.abs(my_spawn.pos.x-closest_obj.pos.x) + Math.abs(my_spawn.pos.y-closest_obj.pos.y);
            for (let i=1;i<targets.length;i++) {
                let sob_range = Math.abs(my_spawn.pos.x-targets[i].pos.x) + Math.abs(my_spawn.pos.y-targets[i].pos.y);
                //            console.log('[DEBUG] (get_build_targets): Current (' + closest_obj.id + '): ' + closest_obj_range + '; Next(' + targets[i].id + '): ' + sob_range);
                if (sob_range < closest_obj_range) {
                    closest_obj = targets[i];
                    closest_obj_range = sob_range;
                }
                //            console.log('[DEBUG] (get_build_targets): Choosen: ' + closest_obj.id);
            }
//        targets.sort((a,b) => (Math.abs(my_spawn.pos.x-a.pos.x) + Math.abs(my_spawn.pos.y-a.pos.y)) - (Math.abs(my_spawn.pos.x-b.pos.x) + Math.abs(my_spawn.pos.y-b.pos.y)));
//        if (closest_obj) console.log('[DEBUG] (get_build_targets): Closest target (' + closest_obj.id + '): ' + JSON.stringify(closest_obj));
        }
        my_room.memory.targets.build = closest_obj ? closest_obj.id : false;
    },
    define_creeps_amount: function() {
        if (Game.time < 5000) {
            my_spawn.memory.general.creeps_max_amount = 'nominal';
        } else if (my_room.memory.target_repair_defence) {
            my_spawn.memory.general.creeps_max_amount = 'repair_defence';
        } else if (my_room.memory.targets_build) {
            my_spawn.memory.general.creeps_max_amount = 'build';
        } else my_spawn.memory.general.creeps_max_amount = 'nominal';
    },
    clean_memory: function() {
        // Clean died creeps
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('[INFO] Clean memory: non-existing creep', name);
            }
        }
    },
    create_extensions: function() {
        var extensions_available = CONTROLLER_STRUCTURES.extension[my_room.controller.level];
        var extensions2add = extensions_available - my_spawn.memory.general.extensions;
        // console.log('[DEBUG] (create_extensions): Extensions to add: ' + extensions2add);
        // var extensions = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});  // building extensions
        // extensions = extensions.concat(my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}})); // ready extensions
        var spawn_pos = my_spawn.pos;
        var y_pos = spawn_pos.y;

        if (extensions2add == 0) return;    // it's no extension to create

        console.log('[INFO] (create_extensions): Start to create a new ' + extensions2add + ' extensions')
        let sx = 0;
        let sy = 0;
        let extensions_rows = 1;
        let add_road_above = false;
        let add_road_below = false;
        let added_extensions = 0;

        switch (my_room.controller.level) {
            case 2:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y+1;
                add_road_above = true;
                break;
            case 3:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y+2;
                add_road_below = true;
                break;
            case 4:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y-2;
                extensions_rows = 2;
                add_road_above = true;
                break;
            case 5:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y+5;
                extensions_rows = 2;
                add_road_below = true;
                break;         }

        console.log('{DEBUG] (create_extensions): X-top:' + sx + '; Y-right:' + sy + '; Road above: ' + add_road_above  + '; below: ' + add_road_below);

        // Create road above if needed
        if (add_road_above) {
            for (var x=sx;x>sx-6;x--) {
                var exit_code = Game.rooms[global_vars.room_name].createConstructionSite(x, sy-1, STRUCTURE_ROAD);
                console.log('[DEBUG] (create_extensions): Create a road above: ' + exit_code);
            }
        }
        // Create extansions
        console.log('[DEBUG](create_extensions): y= ' + (sy+extensions_rows-1));
        for (var y=sy;y<(sy+extensions_rows);y++) {
            for (var x=sx;x>sx-5;x--) {
                var exit_code = Game.rooms[global_vars.room_name].createConstructionSite(x, y, STRUCTURE_EXTENSION);
                console.log('[DEBUG](create_extensions): Creation of extension (' + x + ',' + y + '): ' + exit_code);
                if (exit_code == OK) added_extensions++;
            }
        }
        my_spawn.memory.general.extensions = Game.spawns[global_vars.spawn_name].memory.general.extensions + added_extensions;

        // Create road below if needed
        if (add_road_below) {
            for (var x=sx;x>sx-6;x--) {
                var exit_code = Game.rooms[global_vars.room_name].createConstructionSite(x, sy+extensions_rows, STRUCTURE_ROAD);
                console.log('[DEBUG] (create_extensions): Create a road below: ' + exit_code);
            }
        }
    },
    create_road: function(FromPos, ToPos, p2pPath) {
        /* FromPos, ToPos - RoomPosition with additional keys of 'id' and 'structureType' (use  _.extend(pos, {id: 11111, structureType: xxxxx}))
         p2pPath        - Optional. if given use it instead search a new one
         Return values:
         -1 : FromPos or ToPos is "undefined"
         -2 : the requested road is exist
         */
        if (typeof FromPos == "undefined" || typeof ToPos == "undefined") return -1;

        current_roads = my_room.memory.roads;
        var road_descriptor = FromPos.structureType + FromPos.id.substring(1,4) + '-' + ToPos.structureType + ToPos.id.substring(1,4);

        if (typeof current_roads.find(x => x == road_descriptor) != "undefined") return -2; // Exit if road exists
        var path2target = (p2pPath ? p2pPath : my_room.findPath(FromPos, ToPos, {ignoreCreeps: true}));
        console.log('[INFO] (room_helpers-create_road): Create road From ' + FromPos.structureType + FromPos.id + ' (' + FromPos.x + ', ' + FromPos.y + ')' +
            ' To ' + ToPos.structureType + ToPos.id + ' (' + ToPos.x + ', ' + ToPos.y + ')' + ' Range: ' + path2target.length);
        var xy_path = [];
        for (i in path2target) {
            var p = path2target[i];
            var create_res = my_room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
            if (create_res < 0) console.log('Failed to create');
            else console.log('STATUS: ' + JSON.stringify(my_room.lookAt(p.x, p.y)));
            xy_path.push([p.x, p.y]);
            //get_struct_obj(p.x, p.y);
        }
        //console.log('PATH: ' + JSON.stringify(xy_path));
        var current_roads = my_room.memory.roads;
        current_roads.push(road_descriptor);
        my_room.memory.roads = current_roads;
        return xy_path;
    }
};

module.exports = room_helpers;