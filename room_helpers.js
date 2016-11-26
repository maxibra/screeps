var global_vars = require('global_vars');
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var room_helpers = {
    go2best_source: function(creep) {
        var target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if(target && creep.harvest(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    },
    create_road: function() {
        var target = global_vars.spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        var path2target = global_vars.spawn.pos.findPathTo(target, {ignoreCreeps: true});
        current_roads = global_vars.spawn.memory.roads2
        if (current_roads.find(x => x == target.id)) {
            console.log('Road exist to ' + target.id);
        } else {
            for (i in path2target) {
                console.log('I = ' + i + '; Target = ' + path2target[i])
                var p = path2target[i];
                global_vars.my_room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
            }
            var current_roads = global_vars.spawn.memory.roads2;
            current_roads.push(target.id);
            global_vars.spawn.memory.roads2 = current_roads;
        }
    }
};

module.exports = room_helpers;