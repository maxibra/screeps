var global_vars = require('global_vars');
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
     FromPos, ToPos - RoomPosition (new RoomPosition(spawn_pos.x+1,spawn_pos.y-1,global_vars.my_room.name))
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
    get_transfer_target: function() {
        var targets = global_vars.my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType != STRUCTURE_SPAWN && object.energy < object.energyCapacity)});
        targets.sort((a,b) => a.hits - b.hits);
        targets.push(global_vars.spawn);
        //if (targets[0]) console.log('[DEBUG] (room_helpers-get_transfer_target): Transfer target type: ' + targets[0].structureType);
        global_vars.my_room.memory.target_transfer = targets[0] ? targets[0].id : false;
        return targets[0].id
    },
    get_repair_defence_target: function() {
        var targets = global_vars.my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax});
        targets.sort((a,b) => a.hits - b.hits);
//        console.log('[DEBUG] (get_repair_defence_target): targets: ' + JSON.stringify(targets));
        global_vars.my_room.memory.target_repair_defence = targets[0] ? targets[0].id : false;
    },
    get_repair_civilianl_target: function() {
        var targets = global_vars.my_room.find(FIND_STRUCTURES, {filter: object => !(object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax});
        targets.sort((a,b) => a.hits - b.hits);
        global_vars.my_room.memory.target_repair_civilian = targets[0] ? targets[0].id : false;
    },
    get_build_targets: function() {
        // Extensions have highest priority
        var targets = global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});
        // Defence structures are secondary priority
        if (targets) targets = global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER)});
        // All other structures
        if (targets) targets = (global_vars.my_room.find(FIND_CONSTRUCTION_SITES) || []);
        // Sort targets by close to spawn
        let closest_obj = targets[0];
        if (closest_obj) {
            let closest_obj_range = Math.abs(global_vars.spawn.pos.x-closest_obj.pos.x) + Math.abs(global_vars.spawn.pos.y-closest_obj.pos.y);
            for (let i=1;i<targets.length;i++) {
                let sob_range = Math.abs(global_vars.spawn.pos.x-targets[i].pos.x) + Math.abs(global_vars.spawn.pos.y-targets[i].pos.y);
                //            console.log('[DEBUG] (get_build_targets): Current (' + closest_obj.id + '): ' + closest_obj_range + '; Next(' + targets[i].id + '): ' + sob_range);
                if (sob_range < closest_obj_range) {
                    closest_obj = targets[i];
                    closest_obj_range = sob_range;
                }
                //            console.log('[DEBUG] (get_build_targets): Choosen: ' + closest_obj.id);
            }
//        targets.sort((a,b) => (Math.abs(global_vars.spawn.pos.x-a.pos.x) + Math.abs(global_vars.spawn.pos.y-a.pos.y)) - (Math.abs(global_vars.spawn.pos.x-b.pos.x) + Math.abs(global_vars.spawn.pos.y-b.pos.y)));
//        if (closest_obj) console.log('[DEBUG] (get_build_targets): Closest target (' + closest_obj.id + '): ' + JSON.stringify(closest_obj));
        }
        global_vars.my_room.memory.targets_build = closest_obj ? closest_obj.id : false;
    },
    define_creeps_amount: function() {
        if (Game.time < 5000) {
            global_vars.spawn.memory.general.max = global_vars.screeps_general_nominal;
        } else if (global_vars.my_room.memory.target_repair_defence) {
            global_vars.spawn.memory.general.max = global_vars.screeps_general_repair_defance;
        } else if (global_vars.my_room.memory.targets_build) {
            global_vars.spawn.memory.general.max = global_vars.screeps_general_build;
        } else global_vars.spawn.memory.general.max = global_vars.screeps_general_nominal;
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
        var extensions_available = CONTROLLER_STRUCTURES.extension[global_vars.my_room.controller.level];
        var extensions2add = extensions_available - global_vars.spawn.memory.general.extensions;
        // console.log('[DEBUG] (create_extensions): Extensions to add: ' + extensions2add);
        // var extensions = global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});  // building extensions
        // extensions = extensions.concat(global_vars.my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}})); // ready extensions
        var spawn_pos = global_vars.spawn.pos;
        var y_pos = spawn_pos.y;

        if (extensions2add == 0) return;    // it's no extension to create

        console.log('[INFO] (create_extensions): Start to create a new ' + extensions2add + ' extensions')
        var sx = 0;
        var sy = 0;
        var add_road_above = false;
        var add_road_below = false;
        var added_extensions = 0;

        switch (global_vars.my_room.controller.level) {
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
        }

        console.log('{DEBUG] (create_extensions): X-top:' + sx + '; Y-right:' + sy + 'Road above: ' + add_road_above  + '; below: ' + add_road_below);

        // Create road above if needed
        if (add_road_above) {
            for (var x=sx;x>sx-6;x--) {
                var exit_code = global_vars.my_room.createConstructionSite(x, sy-1, STRUCTURE_ROAD);
                console.log('[DEBUG] (create_extensions): Create a road above: ' + exit_code);
            }
        }
        // Create extansions
        for (var x=sx;x>sx-5;x--) {
            if (global_vars.my_room.createConstructionSite(x, sy, STRUCTURE_EXTENSION) == OK) added_extensions++;
        }
        // Create road below if needed
        if (add_road_below) {
            for (var x=sx;x>sx-6;x--) {
                var exit_code = global_vars.my_room.createConstructionSite(x, sy+1, STRUCTURE_ROAD);
                console.log('[DEBUG] (create_extensions): Create a road below: ' + exit_code);
            }
        }
        global_vars.spawn.memory.general.extensions = global_vars.spawn.memory.general.extensions + added_extensions;
    },
    create_road: function(FromPos, ToPos, p2pPath) {
        /* FromPos, ToPos - RoomPosition with additional keys of 'id' and 'structureType' (use  _.extend(pos, {id: 11111, structureType: xxxxx}))
         p2pPath        - Optional. if given use it instead search a new one
         Return values:
         -1 : FromPos or ToPos is "undefined"
         -2 : the requested road is exist
         */
        if (typeof FromPos == "undefined" || typeof ToPos == "undefined") return -1;

        current_roads = global_vars.my_room.memory.roads;
        var road_descriptor = FromPos.structureType + FromPos.id.substring(1,4) + '-' + ToPos.structureType + ToPos.id.substring(1,4);

        if (typeof current_roads.find(x => x == road_descriptor) != "undefined") return -2; // Exit if road exists
        var path2target = (p2pPath ? p2pPath : global_vars.my_room.findPath(FromPos, ToPos, {ignoreCreeps: true}));
        console.log('[INFO] (room_helpers-create_road): Create road From ' + FromPos.structureType + FromPos.id + ' (' + FromPos.x + ', ' + FromPos.y + ')' +
            ' To ' + ToPos.structureType + ToPos.id + ' (' + ToPos.x + ', ' + ToPos.y + ')' + ' Range: ' + path2target.length);
        var xy_path = [];
        for (i in path2target) {
            var p = path2target[i];
            var create_res = global_vars.my_room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
            if (create_res < 0) console.log('Failed to create');
            else console.log('STATUS: ' + JSON.stringify(global_vars.my_room.lookAt(p.x, p.y)));
            xy_path.push([p.x, p.y]);
            //get_struct_obj(p.x, p.y);
        }
        //console.log('PATH: ' + JSON.stringify(xy_path));
        var current_roads = global_vars.my_room.memory.roads;
        current_roads.push(road_descriptor);
        global_vars.my_room.memory.roads = current_roads;
        return xy_path;
    }
};

module.exports = room_helpers;