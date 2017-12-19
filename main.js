var global_vars = require('global_vars');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');

// JSON.stringify(obj)
var transfer_i = 0;
var builder_i = 1;
var upgrader_i = 2;
var units = [0, 0, 0];
var cur_creeps = Game.creeps ? Game.creeps : {};
var cur_creeps_names = Object.keys(cur_creeps)
var creep_i;
for (creep_i in cur_creeps) {
    switch (cur_creeps[creep_i].memory.role) {
        case 'transfer':
            units[transfer_i]++;
            break;
        case 'builder':
            units[builder_i]++;
            break;
        case 'upgrader':
            units[upgrader_i]++;
            break;
    }
}

function get_struct_obj(x, y) {
    var stuctures = global_vars.my_room.lookAt(x,y);
    console.log('XY: ' + x + '-' +y + '; STRUCT: ' + JSON.stringify(stuctures));
    for (var s in stuctures) console.log(stuctures[s]);
}

module.exports.loop = function () {
    console.log('Creeps: ' + cur_creeps_names.length + '; Transfers: ' + units[transfer_i] + '; Builders: '+ units[builder_i] + '; Upgraders: '+ units[upgrader_i]);

    (Game.time % 1000) && creep_helpers.clean_memory();
    if ((cur_creeps_names.length < 5) || (Game.time % 1000)) creep_helpers.create_creep();
    if (Game.time % 300) {  // run every 5 minutes
        room_helpers.create_extensions();
    }
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