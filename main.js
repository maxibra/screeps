var global_vars = require('global_vars');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');

// JSON.stringify(obj)
var units = {
    'total': 0,
    'transfer': 0,
    'build': 0,
    'upgrade': 0,
    'rapair': 0,
    'harvest': 0,
};

var cur_creeps = Game.creeps ? Game.creeps : {};
var cur_creeps_names = Object.keys(cur_creeps)
for (var creep_name in cur_creeps) {
    units[cur_creeps[creep_name].memory.role]++;
    units['total']++;
}

function get_struct_obj(x, y) {
    var stuctures = global_vars.my_room.lookAt(x,y);
    console.log('XY: ' + x + '-' +y + '; STRUCT: ' + JSON.stringify(stuctures));
    for (var s in stuctures) console.log(stuctures[s]);
}

module.exports.loop = function () {
    var s_types = '';
//    for (var t in Object.keys(units) s_types = s_types + t + ': ' + units[t];
    console.log(JSON.stringify(units));

    if (Game.time % 300) {
        room_helpers.create_extensions();
    }

    if (Game.time % 1000) {
        creep_helpers.clean_memory();
    }

    if ((cur_creeps_names.length < 5) || (Game.time % 1000)) creep_helpers.create_creep();

    // Create first roads
    if (global_vars.spawn.memory.roads.length == 0) {
        var xy_path = room_helpers.create_road(_.extend(global_vars.spawn.pos, {id: global_vars.spawn.id, structureType: 'spawn'}), _.extend(global_vars.spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'}));  // Spawn-Closest Source
        for (i in xy_path) get_struct_obj(xy_path[i][0], xy_path[i][1]);
        room_helpers.create_road(_.extend(global_vars.my_room.controller.pos, {id: global_vars.my_room.controller.id, structureType: 'controller'}), _.extend(global_vars.my_room.controller.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'})); // Controller-Closest Source
        // Save in memory important path to build first
        global_vars.spawn.memory.important_structures = xy_path;
    }
    creep_helpers.run(units);
}