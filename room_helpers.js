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
    upgrade_energy_flow: function() {
        // Containers
        let all_containers = Game.rooms[global_vars.room_name].find(FIND_STRUCTURES, {filter: object = > (object.structureType === STRUCTURE_CONTAINER)});
        let all_links = Game.rooms[global_vars.room_name].find(FIND_STRUCTURES, {filter: object = > (object.structureType === STRUCTURE_LINK)});
        let all_sources = Game.rooms[global_vars.room_name].memory.energy_flow.sources;
        let energy_flow_obj = Game.rooms[global_vars.room_name].memory.energy_flow;
        // Sort containers
        for (let i = 0; i < all_containers.length; i++) {
            container_defined = false;
            if ((typeof energy_flow_obj.containers.controller[all_containers[i].id] === 'undefined') && all_containers[i].pos.getRangeTo(Game.rooms[global_vars.room_name].controller) < 5) {
                energy_flow_obj.containers.controller[all_containers[i].id] = false;
                container_defined = true
            } else {
                for (let j = 0; j < all_sources.length; j++) {
                    if ((typeof energy_flow_obj.containers.source[all_containers[i].id] === 'undefined') && all_containers[i].pos.getRangeTo(Game.getObjectById(all_sources[j])) === 1) {
                        energy_flow_obj.containers.source[all_containers[i].id].source_id = all_sources[j].id;
                        energy_flow_obj.containers.source[all_containers[i].id].creep_id = false;
                        container_defined = true;
                        break;
                    }
                }
            }
            if (!container_defined && (typeof energy_flow_obj.containers.other[all_containers[i].id] === 'undefined')) energy_flow_obj.containers.other[all_containers[i].id] = false;
        }
        // Delete missing containers IDs
        let containers_types = Object.keys(energy_flow_obj.containers);
        for (let ct = 0; ct < containers_types.length; ct++) {
            let current_containers_ids = Object.keys(energy_flow_obj.containers[ct]);
            for (let i = 0; current_containers_ids.length; i++) {
                let pretendet2remove = current_containers_ids[i];
                if (!all_containers.includes(pretendet2remove)) delete energy_flow_obj.containers[ct][pretendet2remove];
        }

        // Links
        for (let i=0;i<all_links.length;i++) {
            if ((typeof energy_flow_obj.links.controller[all_links[i].id] === 'undefined') && all_links[i].pos.getRangeTo(Game.rooms[global_vars.room_name].controller) < 5) {
                energy_flow_obj.links.controller[all_links[i].id] = [all_links[i].pos.x,all_links[i].pos.y];
            } else if ((typeof energy_flow_obj.links.source[all_links[i].id] === 'undefined')){
                energy_flow_obj.links.source[all_links[i].id] =  [all_links[i].pos.x,all_links[i].pos.y];
            }
        }

        // Delete missing Links IDs
        let links_types = Object.keys(energy_flow_obj.links);
        for (let lt = 0; lt < links_types.length; ct++) {
            if (!all_containers.includes(energy_flow_obj.links[lt])) energy_flow_obj.links[lt] = false;
        }
        console.log('[DEBUG] (room_helpers.upgrade_energy_flow): ENERGY Flow: ' + JSON.stringify(energy_flow_obj));
        Game.rooms[global_vars.room_name].memory.energy_flow = energy_flow_obj;
    },
    define_room_status: function() {
        let hostile_creeps = Game.rooms[global_vars.room_name].find(FIND_HOSTILE_CREEPS);
        if (hostile_creeps && hostile_creeps.length > 0 && Game.spawns[spawn_name].memory.general.status === 'peace') {
            Game.spawns[spawn_name].memory.general.status = 'war';
            Game.notify('WE are attacked from (' + hostile_creeps[0].x + ',' + hostile_creeps[0].y + '); Body: ' + JSON.stringify(hostile_creeps[0].body));
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
        my_room.memory.target_transfer = targets[0] ? targets[0].id : false;
        return targets[0].id
    },
    get_repair_defence_target: function() {
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax});
        targets.sort((a,b) => a.hits - b.hits);
//        console.log('[DEBUG] (get_repair_defence_target): targets: ' + JSON.stringify(targets));
        my_room.memory.target_repair_defence = targets[0] ? targets[0].id : false;
    },
    get_repair_civilianl_target: function() {
        var targets = my_room.find(FIND_STRUCTURES, {filter: object => !(object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax});
        targets.sort((a,b) => a.hits - b.hits);
        my_room.memory.target_repair_civilian = targets[0] ? targets[0].id : false;
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
        my_room.memory.targets_build = closest_obj ? closest_obj.id : false;
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