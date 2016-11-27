var global_vars = require('global_vars');
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
var extensions_rate = {1:0, 2:5, 3:10, 4:20, 5:30, 6:40, 7:50, 8:60};

var room_helpers = {
    go2best_source: function(creep) {
        var target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if(target && creep.harvest(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    },
    create_extension: function() {

    },
    create_road: function(FromPos, ToPos) {
        if (typeof FromPos == "undefined" || typeof ToPos == "undefined") return;

        current_roads = global_vars.spawn.memory.roads;
        var road_descriptor = FromPos.structureType + FromPos.id.substring(1,4) + '-' + ToPos.structureType + ToPos.id.substring(1,4);

        if (typeof current_roads.find(x => x == road_descriptor) != "undefined") return; // Exit if road exists
        var path2target = global_vars.my_room.findPath(FromPos, ToPos, {ignoreCreeps: true});
        console.log('Create road From ' + FromPos.structureType + FromPos.id + ' To ' + ToPos.structureType + ToPos.id + ' Range: ' + path2target.length);
        for (i in path2target) {
            var p = path2target[i];
            var res = global_vars.my_room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
        }
        var current_roads = global_vars.spawn.memory.roads;
        current_roads.push(road_descriptor);
        global_vars.spawn.memory.roads = current_roads;
    }
};

module.exports = room_helpers;