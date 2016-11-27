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
    create_road: function(target_name) {
        if (typeof target_name == "undefined") return;
        switch(target_name) {
            case 'source':
                var target = global_vars.spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                break;
            case 'controller':
                var target = global_vars.my_room.controller;
                break;
        }
        var path2target = global_vars.spawn.pos.findPathTo(target, {ignoreCreeps: true});
        current_roads = global_vars.spawn.memory.roads2
        // console.log('Create roaad to ' + target_name + 'ID: ' + target.id);
        if (typeof current_roads.find(x => x == target.id) != "undefined") return
        for (i in path2target) {
            // console.log('I = ' + i + '; Target = ' + path2target[i])
            var p = path2target[i];
            var res = global_vars.my_room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
        }
        var current_roads = global_vars.spawn.memory.roads2;
        current_roads.push(target.id);
        global_vars.spawn.memory.roads2 = current_roads;
    }
};

module.exports = room_helpers;