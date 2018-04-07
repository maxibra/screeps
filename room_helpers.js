// var global_vars = require('global_vars')();
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

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
        let my_room = Game.rooms[room_name];
        for (let l_src in my_room.memory.energy_flow.links.sources) {
            source_link = Game.getObjectById(my_room.memory.energy_flow.links.sources[l_src]);
            if (!(source_link && (source_link.energy > 100))) continue;
            for (let l_dst in my_room.memory.energy_flow.links.destinations) {
                destination_link = Game.getObjectById(my_room.memory.energy_flow.links.destinations[l_dst])
                if (destination_link && (destination_link.energy/destination_link.energyCapacity < 0.9)) {
                    let dst_missing = destination_link.energyCapacity - destination_link.energy;
                    let energy2transfer = ((dst_missing < source_link.energy) ? dst_missing : source_link.energy);
                    source_link.transferEnergy(destination_link, energy2transfer);
                }
                if (source_link.energy < 100) break;
            }
        }
    },
    upgrade_energy_flow: function(room_name) {
        // Containers
        let my_room = Game.rooms[room_name];
        // let all_containers = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_CONTAINER)});
        // let all_continers_ids = all_containers.map(x => x.id);
        let all_links = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LINK)});
        let all_links_ids = all_links.map(x => x.id);
        let all_sources = my_room.memory.energy_flow.sources;
        let energy_flow_obj = my_room.memory.energy_flow;
        let local_energy_flow_obj = {
            sources: my_room.memory.energy_flow.sources, 
            containers: {source :{}}, 
            links: {source: false, controller: false, destinations: [], sources: []}
        }
        // Sort containers
        // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): All Containers: ' + JSON.stringify(all_containers.map(x => x.id)));
        // for (let i = 0; i < all_containers.length; i++) {
        //     if (all_containers[i].pos.getRangeTo(my_room.controller) < 5) {
        //         local_energy_flow_obj.containers.controller[all_containers[i].id] = my_room.controller;
        //         container_defined = true
        //     } else {
        //         for (let j = 0; j < all_sources.length; j++) {
        //             if (all_containers[i].pos.getRangeTo(Game.getObjectById(all_sources[j])) === 1) {
        //                 local_energy_flow_obj.containers.source[all_containers[i].id] = all_sources[j];
        //                 container_defined = true;
        //                 // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Added Container: ' + all_containers[i].id + '; Source: ' + JSON.stringify(energy_flow_obj));
        //                 break;
        //             }
        //         }
        //     }
        //     // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Container: ' + all_containers[i].id + ' is Defined: ' + container_defined);
        //     if (!container_defined && (local_energy_flow_obj.containers.other !== all_containers[i].id)) local_energy_flow_obj.containers.other[all_containers[i].id] = false;
        // }

        // Links
        // *** LOG
        // console.log('[DEBUG](room_helpers.upgrade_energy_flow)[' + room_name + ']: All links: ' + all_links.length + 'Local obj:' + JSON.stringify(local_energy_flow_obj));

        let all_flags = my_room.find(FIND_FLAGS, {filter: object => (object.name.substring(0,4) === 'link')});
        let link_src_positions = [];
        let link_dst_positions = [];
        for (let f in all_flags)
            if (all_flags[f].name.substring(0,8) === 'link_src') link_src_positions.push(all_flags[f].pos.x +'-' + all_flags[f].pos.y);
            else link_dst_positions.push(all_flags[f].pos.x +'-' + all_flags[f].pos.y);

        for (let l in all_links) {
            let link_pos_str = all_links[l].pos.x + '-' + all_links[l].pos.y;
            if (link_src_positions.indexOf(link_pos_str) >= 0 ) local_energy_flow_obj.links.sources.push(all_links[l].id);
            else local_energy_flow_obj.links.destinations.push(all_links[l].id);
        }
            
        // check STORAGE in the room
        storage_target = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_STORAGE)});
        local_energy_flow_obj.storage = (storage_target.length > 0) ? storage_target[0].id : false;
        
        Game.rooms[room_name].memory.energy_flow = local_energy_flow_obj;
    },
    define_room_status: function(room_name) {
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let global_vars = Memory.rooms.global_vars;
        let hostile_creeps = Game.rooms[room_name].find(FIND_HOSTILE_CREEPS);
        if (hostile_creeps && hostile_creeps.length > 0 && room_vars.status === 'peace') {
            room_vars.status = 'war';
            let hostile_boosts = {};
            for(let b in hostile_creeps[0].body) {
                let cur_boost = hostile_creeps[0].body[b].boost;
                if(!hostile_boosts[cur_boost]) hostile_boosts[cur_boost] = 1;
                else hostile_boosts[cur_boost]++;
            }
            Game.notify(room_name + ' is attacked from (' + hostile_creeps[0].pos.x + ',' + hostile_creeps[0].pos.y + '); by ' + hostile_creeps[0].owner.username + '; Body: ' + JSON.stringify(hostile_boosts));
        } else if (room_vars.status === 'war' && !room_vars.finish_war) {
            room_vars.finish_war = Game.time + global_vars.update_period.after_war;
            console.log('[DEBUG] (define_room_status)[' + room_name + '] Define finish war to ' +  (Game.time + global_vars.update_period.after_war));
        } else if (room_vars.finish_war < Game.time && room_vars.status === 'war') {
            room_vars.status = 'peace';
            room_vars.finish_war = false;
            Game.notify('[' + room_name + '] It"s time for PEACE');
        }
    },
    get_energy_source_target: function(room_name) {
        let targets = Game.rooms[room_name].find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_CONTAINER && (object.store/object.storeCapacity) > 0.3)});

        //targets.contact()
    },
    get_transfer_target: function(room_name) {
//        let towers = my_room.find(FIND_MY_STRUCTURES, {filter: object => (structureType: STRUCTURE_TOWER && object.energy < object.energyCapacity)});
        let my_room = Game.rooms[room_name];
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType != STRUCTURE_SPAWN && object.energy < object.energyCapacity)});
        //targets.sort((a,b) => a.hits - b.hits);
        // targets.push(my_spawn);
        //if (targets[0]) console.log('[DEBUG] (room_helpers-get_transfer_target): Transfer target type: ' + targets[0].structureType);
        my_room.memory.targets.transfer = targets[0] ? targets[0].id : false;
        return targets[0].id
    },
    get_repair_defence_target: function(room_name) {
        let my_room = Game.rooms[room_name];
        let targets = [];
        repair_only = {
            'E38N48': ['5aa0bee77ad634646aa08a49', '5ab39a6b04e7f14b97aa3056', '5ab39a586e59881daa1eb094', '5ab39a827ad7de1dd176d6db',
                       '5aa0befa7d8eb10a43e101d3', '5aa0bef30f678357d2601767', '5ab39ab7e7f5aa102de370ac', '5ab39ad233287758623d625e', '5ab39aed8e83a870b36a81e5',
                       '5ac72c64c769531bae38da9b', '5ac7589eb96a887ad73984a6']
        }
        // *** LOG
        // console.log('[DEBUG] (room.helpers.get_repair_defence_target)[' + room_name + '] Repair_only: ' +  repair_only[room_name]);

        if (repair_only[room_name]) for(let id in repair_only[room_name]) targets.push(Game.getObjectById(repair_only[room_name][id]))
        else {
            E38N48_avoid = ['5aba595ad360fc7cd874e352', '5aba594f74b96f64ff232dc9', '5aa0beee3c525457e6f84f7f', '5ab39a9c8a0c83586e5bfb1e',
                '5a962bd55044c20a227e09b9', '5a962bcb77d91872df3159b4', '5a962bc5dca94812fc07024f', '5a962bbed183f34ad9a0d823', '5a962bb74e67460a13b276e7', '5a962bb004d2337105e8d4d4',
                '5a962babcdf030710646711f', '5a962ba4b29c3312dfd01a8b', '5a962b9d53266d146db74952', '5a962b9aefb803145385e4ba', '5a962b974d6ed3145e8181e5', '5a962b94eb14d24ac01c90dc',
                '5a962b8fc459521302a045fe', '5a962b8b1de6ab12eac16be3', '5a96062c5723bd4269c0d824', '5a9606294b5e6a425420fd92', '5a9606267629a93737b6502c', '5aa0c3cc89b39e64781ba746',
                '5aa0c3c8af76d4649b2254b9', '5aa0c3c563159c4aede223f1', '5aa0c3c27ad634646aa08c1a', '5a960632aa03f0374692af1c', '5a96062f69de9865d796c8b3', '5a96063e69de9865d796c8be',
                '5a90ee1696f41740d4d4b4c9', '5a90ee1e96b6b440aad8c3d3', '5a960213a2a07606dea594f7', '5a960210896b0b06baf0e580', '5a90ee1c1ac6c205f425ab7e', '5a90ee1949f9d34c1b394475']
            E39N49_avoid = ['5a3c93c377eddf3fcd2289e4', '5a4a8d9320171220b29bfbab', '5a3c9af47739a911457f0943', '5a4235091752005a72e4bf72', '5a3c8b5bf0d6a259c0ea8758', '5a3c8b3ea0bbf83fe1d871b7',
                '5a434aad352f7c7e6c4b88d1', '5a437edae9ad370d6f80c979', '5a436eb786a4a36e5af6c89e', '5a436c93b5b012359cb81bd2', '5a436bb28ee5032e65a12834', '5a4365fd262eb037220fc9b4',
                '5a4364e3eba40146402df274', '5a4364e3eba40146402df274', '5a4361ecb458c9595ccdf3b7', '5a435fd9176c8f376528dbb8', '5a3ff7de9fceac2ef90ce320', '5a3ff7d8b8d7566bedfb37e9', 
                '5a3ff7b6f5244f2f04d4a54f', '5a3ff51722e6562eb8171f7b', '5a3ff1135f1df3160a8dbdf3', '5a3fe041f6b67970b93a092a',
                '5a3ff5a84172f32ee0f2a126', '5a3ff3498bf01e096223d330', '5a3fef638bd11d24563999c5', '5a3fee6787ab8c2441b9587a', '5a3fed02265a181611e3f081', '5a3fe9f63cc43f5f102d6a7c',
                '5a3fe9300796205f06f8956d', '5a3feac9824fe1202d5ceb63', '5a437edae9ad370d6f80c979', '5a436eb786a4a36e5af6c89e', '5a436c93b5b012359cb81bd2', '5a436bb28ee5032e65a12834',
                '5a4365fd262eb037220fc9b4', '5a4364e3eba40146402df274', '5a43637fb8cafb5972604b24', '5a4361ecb458c9595ccdf3b7', '5a435fd9176c8f376528dbb8', '5a3c93c377eddf3fcd2289e4',
                '5a4a8d9320171220b29bfbab', '5a3c9af47739a911457f0943', '5a4235091752005a72e4bf72', '5a3c8b5bf0d6a259c0ea8758', '5a3c8b3ea0bbf83fe1d871b7', '5a434aad352f7c7e6c4b88d1']
            E37N48_avoid = ['5abc9c2488988449d6f1d066', '5abc9261ce03634b9a5884de']
            let avoid_stricts = E39N49_avoid.concat(E38N48_avoid);
            avoid_stricts = avoid_stricts.concat(E37N48_avoid);
            targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART) && object.hits < 1000000 && avoid_stricts.indexOf(object.id) === -1});
        }
        // console.log('[DEBUG] (get_repair_defence_target)[' + room_name +']: targets: ' + JSON.stringify(targets));
        targets.sort((a,b) => a.hits - b.hits);
//        console.log('[DEBUG] (get_repair_defence_target): targets: ' + JSON.stringify(targets));
        my_room.memory.targets.repair_defence = targets[0] ? targets[0].id : false;
    },
    get_repair_civilianl_target: function(room_name) {
        let my_room = Game.rooms[room_name];
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => !(object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER) && object.hits < object.hitsMax});
        targets.sort((a,b) => a.hits - b.hits);
        my_room.memory.targets.repair_civilian = targets[0] ? targets[0].id : false;
    },
    get_build_targets: function(room_name) {
        // Extensions have highest priority
        let my_room = Game.rooms[room_name];
        // let targets = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});
        targets = [];
        // Defence structures are secondary priority
        if (targets.length === 0) targets = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER)});
        // All other structures
        if (targets.length === 0) targets = my_room.find(FIND_CONSTRUCTION_SITES);

        // Sort targets by close to spawn
        // let closest_obj = targets[0];
        // console.log('[DEBUG] (get_build_targets): targets: ' + JSON.stringify(targets[0].ops));
//         if (closest_obj) {
//             let closest_obj_range = Math.abs(my_spawn.pos.x-closest_obj.pos.x) + Math.abs(my_spawn.pos.y-closest_obj.pos.y);
//             for (let i=1;i<targets.length;i++) {
//                 let sob_range = Math.abs(my_spawn.pos.x-targets[i].pos.x) + Math.abs(my_spawn.pos.y-targets[i].pos.y);
//                 //            console.log('[DEBUG] (get_build_targets): Current (' + closest_obj.id + '): ' + closest_obj_range + '; Next(' + targets[i].id + '): ' + sob_range);
//                 if (sob_range < closest_obj_range) {
//                     closest_obj = targets[i];
//                     closest_obj_range = sob_range;
//                 }
//                 //            console.log('[DEBUG] (get_build_targets): Choosen: ' + closest_obj.id);
//             }
// //        targets.sort((a,b) => (Math.abs(my_spawn.pos.x-a.pos.x) + Math.abs(my_spawn.pos.y-a.pos.y)) - (Math.abs(my_spawn.pos.x-b.pos.x) + Math.abs(my_spawn.pos.y-b.pos.y)));
// //        if (closest_obj) console.log('[DEBUG] (get_build_targets): Closest target (' + closest_obj.id + '): ' + JSON.stringify(closest_obj));
//         }
        targets_id = [];
        for (let i in targets) targets_id.push(targets[i].id);
        // my_room.memory.targets.build = (targets.length > 0) ? targets[0].id : false;
        my_room.memory.targets.build = (targets.length > 0) ? targets_id : false;
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