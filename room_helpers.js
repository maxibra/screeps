var global_vars = require('global_vars');
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
var extensions_rate = {1:0, 2:5, 3:10, 4:20, 5:30, 6:40, 7:50, 8:60};

var room_helpers = {
    go2best_source: function(creep) {
        var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if(source && (creep.harvest(source) == ERR_NOT_IN_RANGE || creep.harvest(source) == OK)) {
            creep.moveTo(source);
        }
        //console.log('Source:' + source);
        //return [source.pos.x, source.pos.y];
    },
    create_extensions: function() {
        var available_extensions = extensions_rate[global_vars.my_room.controller.level];
        var extensions = global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});
        extensions = extensions.concat(global_vars.my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}}));
        var spawn_pos = global_vars.spawn.pos;
        var y_pos = spawn_pos.y - 1
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

        current_roads = global_vars.spawn.memory.roads;
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
        var current_roads = global_vars.spawn.memory.roads;
        current_roads.push(road_descriptor);
        global_vars.spawn.memory.roads = current_roads;
        return xy_path;
    }
};

module.exports = room_helpers;