var global_vars = require('global_vars');
var roleStructCreep = require('role.struct_creep');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');


var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];

// Itiliaze spawn memory with creep's metadata
if (typeof Game.spawns[spawn_name].memory.general === "undefined") {
    Game.spawns[spawn_name].memory.general = {
        gen: 0,
        index: 0,
        max: global_vars.screeps_general_nominal,
        status: 'peace',
        extensions: 0
    };
}

// Initialie the room memory
//if (typeof Game.rooms[room_name].memory.general === "undefined") {
Game.rooms[room_name].memory.global_vars = {
    age_to_drop_and_die: 20,
    spawn_name: spawn_name,
    spawn_name: spawn_name,
    room_name: room_name,
    screeps_general_nominal: 10,
    screeps_general_war: 30,
    screeps_general_repair_defance: 20,
    screeps_general_build: 15,
    moveTo_ops: {
        reusePath: 10,           // default: 5
        //serializeMemory: false, // default: true
        //noPathFinding: true, // default: false
        visualizePathStyle: {
            fill: 'transparent',
            stroke: '#fff',
            lineStyle: 'dashed',
            strokeWidth: .15,
            opacity: .1
        }
    },
    creep_types: {
        war: {
            transfer: [0, 0.30, 0.30, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5],     // max percentage of transfer from total creeps. indwx is romm's level
            build: 0.60,        // max percentage of builders from total creeps
            repair_defence: 0.4,          // max percentage of repair units from total creeps
            repair_civilian: 0.2,          // max percentage of repair units from total creeps
            special_carry: 0.3
        },
        peace: {
            transfer: 0.2,      // max percentage of transfer from total creeps
            build: 0.30,        // max percentage of builders from total creeps
            repair_defence: 0.1,          // max percentage of repair units from total creeps
            repair_civilian: 0.1,          // max percentage of repair units from total creeps
            special_carry: 0.3
        }
    }
}
//}
// console.log('Creeps general: ' + JSON.stringify(spawn.memory.general));

// JSON.stringify(obj)


var cur_creeps = Game.creeps ? Game.creeps : {};
var global_vars = Game.rooms[room_name].memory.global_vars;
var my_spawn = Game.spawns[global_vars.spawn_name];
var my_room = Game.rooms[global_vars.room_name];

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
    console.log('[INFO] (main): START  UNITS (nominal: ' + my_spawn.memory.general.max + '; workers: ' + (units.total - units.harvest) + '): ' + JSON.stringify(units));
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
        var xy_path = room_helpers.create_road(_.extend(my_spawn.pos, {id: my_spawn.id, structureType: 'spawn'}), _.extend(my_spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'}));  // Spawn-Closest Source
        for (i in xy_path) get_struct_obj(xy_path[i][0], xy_path[i][1]);
        room_helpers.create_road(_.extend(global_vars.my_room.controller.pos, {id: my_room.controller.id, structureType: 'controller'}), _.extend(my_room.controller.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'})); // Controller-Closest Source
        // Save in memory important path to build first
        //global_vars.my_room.memory.important_structures = xy_path;
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        var creep_role = creep.memory.role
        roleStructCreep.run(creep, units);
    }
//    console.log('[INFO] (main): FINISH UNITS (nominal: ' + my_spawn.memory.general.max + '): ' + JSON.stringify(units));

}