var global_vars = require('global_vars');
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var room_helpers = {
    get_transfer_target: function() {
        var targets = global_vars.my_room.find(FIND_STRUCTURES, {filter: object => object.energy < object.energyCapacity });
        targets.sort((a,b) => a.hits - b.hits);
        global_vars.my_room.memory.target_transfer = targets[0] ? targets[0].id : false;
    },
    get_build_targets: function() {
        //var important_structure = global_vars.spawn.memory.important_structures || [];
        //var targets = (typeof important_structure == 'undefined' || important_structure.length == 0 ? [] : [important_structure]);
        var targets = global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});  // Extensions have highest priority
        if (targets.length == 0) targets = (global_vars.my_room.find(FIND_CONSTRUCTION_SITES) || []);
        global_vars.my_room.memory.targets_build = targets[0] ? targets[0].id : false;
    },
    create_extensions: function() {
        var available_extensions = CONTROLLER_STRUCTURES.extension[global_vars.my_room.controller.level];
        var extensions = global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});
        extensions = extensions.concat(global_vars.my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}}));
        var spawn_pos = global_vars.spawn.pos;
        var y_pos = spawn_pos.y
        for (i=0;i<(available_extensions-extensions.length);i++) {
            var x_pos = spawn_pos.x - i - 1;
            while (global_vars.my_room.createConstructionSite(x_pos, y_pos, STRUCTURE_EXTENSION) == ERR_INVALID_TARGET) y_pos++;
        }
    },
    missin_extension_energy: function() {
        // Check exist not full extensions
        var extensions = Game.rooms.sim.find(FIND_MY_STRUCTURES, {   filter: { structureType: STRUCTURE_EXTENSION } });
        var missing_extensions_energy = 0;
        for (i in extensions) {
            missing_extensions_energy += (extensions[i].energyCapacity - extensions[i].energy)
        }
    },
    create_road: function(FromPos, ToPos) {
        if (typeof FromPos == "undefined" || typeof ToPos == "undefined") return;

        current_roads = global_vars.my_room.memory.roads;
        var road_descriptor = FromPos.structureType + FromPos.id.substring(1,4) + '-' + ToPos.structureType + ToPos.id.substring(1,4);

        if (typeof current_roads.find(x => x == road_descriptor) != "undefined") return; // Exit if road exists
        var path2target = global_vars.my_room.findPath(FromPos, ToPos, {ignoreCreeps: true});
        console.log('Create road From ' + FromPos.structureType + FromPos.id + ' To ' + ToPos.structureType + ToPos.id + ' Range: ' + path2target.length);
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