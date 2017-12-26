var global_vars = require('global_vars');
var roleStructCreep = require('role.struct_creep');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');


global_vars = global_vars()
// Itiliaze spawn memory with creep's metadata
if (typeof global_vars.spawn.memory.general == "undefined") {
    global_vars.spawn.memory.general = {
        gen: 0,
        index: 0,
        max: global_vars.screeps_general_nominal,
        status: 'peace',
        extensions: 0
    };
}
// console.log('Creeps general: ' + JSON.stringify(spawn.memory.general));

// JSON.stringify(obj)


var cur_creeps = Game.creeps ? Game.creeps : {};
var cur_creeps_names = Object.keys(cur_creeps)


function get_struct_obj(x, y) {
    var stuctures = global_vars.my_room.lookAt(x,y);
    console.log('XY: ' + x + '-' +y + '; STRUCT: ' + JSON.stringify(stuctures));
    for (var s in stuctures) console.log(stuctures[s]);
}

module.exports.loop = function () {
    var units = {
        'total': 0,
        'transfer': 0,
        'build': 0,
        'upgrade': 0,
        'repair_defence': 0,
        'repair_civilian': 0,
        'harvest': 0,
        'undefined': 0,
        'special_carry': 0
    };
    for (var creep_name in cur_creeps) {
        splited_name = creep_name.split('-');
        if (typeof cur_creeps[creep_name].memory.special == "undefined") units[cur_creeps[creep_name].memory.role]++;
        else units[cur_creeps[creep_name].memory.special]++;
        units['total']++;
    }
    var s_types = '';

//    for (var t in Object.keys(units) s_types = s_types + t + ': ' + units[t];
    console.log('[INFO] (main): START  UNITS (nominal: ' + global_vars.spawn.memory.general.max + '; workers: ' + (units.total - units.harvest) + '): ' + JSON.stringify(units));
    let current_mod = 0;
    let tick_between_hard_actions = 2;

    if (Game.time % 10 === current_mod) {  // run every 10 ticks
        console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
        room_helpers.get_transfer_target();
    }

    current_mod = current_mod + tick_between_hard_actions;
    if (Game.time % 10 === current_mod) {  // run every 10 ticks
        console.log('[INFO] (main): RUN 10 tickets functions +' + current_mod + '. Time: ' + Game.time);
        room_helpers.get_repair_defence_target();
    }

    current_mod = current_mod + tick_between_hard_actions;
    if (Game.time % 10 === current_mod) {  // run every 10 ticks
        console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
        room_helpers.get_repair_civilianl_target();
    }

    current_mod = current_mod + tick_between_hard_actions;
    if (Game.time % 10 === current_mod) {  // run every 10 ticks
        console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
        room_helpers.get_build_targets();
    }

    current_mod = current_mod + tick_between_hard_actions;
    if (Game.time % 10 === current_mod) {  // run every 10 ticks
        console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
        room_helpers.define_creeps_amount();
    }

    if (Game.time % 2  === 0) {  // run every 30 ticks
        console.log('[INFO] (main): RUN 15 tickets functions. Time: ' + Game.time);
        creep_helpers.create_creep(units);
    }

    if (Game.time % 300 === 0) {
        room_helpers.create_extensions();
    }

    if (Game.time % 1000 === 0) {
        room_helpers.clean_memory();
    }

    // Create first roads
    if (typeof global_vars.my_room.memory.roads == "undefined") {
        global_vars.my_room.memory.roads = [];
        var xy_path = room_helpers.create_road(_.extend(global_vars.spawn.pos, {id: global_vars.spawn.id, structureType: 'spawn'}), _.extend(global_vars.spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'}));  // Spawn-Closest Source
        for (i in xy_path) get_struct_obj(xy_path[i][0], xy_path[i][1]);
        room_helpers.create_road(_.extend(global_vars.my_room.controller.pos, {id: global_vars.my_room.controller.id, structureType: 'controller'}), _.extend(global_vars.my_room.controller.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'})); // Controller-Closest Source
        // Save in memory important path to build first
        //global_vars.my_room.memory.important_structures = xy_path;
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        var creep_role = creep.memory.role
        roleStructCreep.run(creep, units);
    }
//    console.log('[INFO] (main): FINISH UNITS (nominal: ' + global_vars.spawn.memory.general.max + '): ' + JSON.stringify(units));

}