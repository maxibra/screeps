//var global_vars = require('global_vars');
var roleStructCreep = require('role.struct_creep');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');
var roleTower = require('struct.tower');

// dummy 6

var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];

// Itiliaze spawn memory with creep's metadata
if (typeof Game.spawns[spawn_name].memory.general === "undefined") {
    Game.spawns[spawn_name].memory.general = {
        gen: 0,
        index: 0,
        status: 'peace',
        extensions: 0
    };
}

// Initialie the room memory
if (typeof Game.rooms[room_name].memory.towers === "undefined") {
    Game.rooms[room_name].memory.towers = {
        list: [],
        next_update: Game.time,
    }
}

if (typeof Game.rooms[room_name].memory.targets === "undefined") {
    Game.rooms[room_name].memory.targets = {};
}

if (typeof Game.rooms[room_name].memory.energy_flow === "undefined") {
    Game.rooms[room_name].memory.energy_flow = {
        containers: {
            source: {},
            controller: {},
            other: {}
        },
        links: {
            source: false,
            controller: false
        },
        sources: Game.rooms[room_name].find(FIND_SOURCES).map(x => x.id)
}
};

if (typeof Game.rooms[room_name].memory.global_vars === "undefined") {
    Game.rooms[room_name].memory.global_vars = {
        age_to_drop_and_die: 20,
        spawn_name: spawn_name,
        room_name: room_name,
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
        screeps_max_amount: {
            peace: 10,
            war: 30,
            repair_defence: 30,
            build: 15,
            nominal: 15
        },
        creep_types: {
            war: {
                transfer: [0, 0.30, 0.30, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5],     // max percentage of transfer from total creeps. index is romm's level
                build: 0.60,        // max percentage of builders from total creeps
                repair_defence: 0.4,          // max percentage of repair units from total creeps
                repair_civilian: 0.2,          // max percentage of repair units from total creeps
                special_carry: 0.3
            },
            peace: {
                transfer: [0, 0.30, 0.30, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5],     // max percentage of transfer from total creeps. index is romm's level
                build: 0.30,        // max percentage of builders from total creeps
                repair_defence: 0.1,          // max percentage of repair units from total creeps
                repair_civilian: 0.1,          // max percentage of repair units from total creeps
                special_carry: 0.4
            }
        },
        update_period: {
            after_war: 150,
            towers: 1000
        }
    }
}
// console.log('Creeps general: ' + JSON.stringify(spawn.memory.general));

// JSON.stringify(obj)

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

    //console.log('[DEBUG] (main): MAX Creeps: ' + JSON.stringify(Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount));
    var cur_creeps = Game.creeps ? Game.creeps : {};
    for (var creep_name in cur_creeps) {
        splited_name = creep_name.split('-');
        if (typeof cur_creeps[creep_name].memory.special == "undefined") units[cur_creeps[creep_name].memory.role]++;
        else units[cur_creeps[creep_name].memory.special]++;
        units['total']++;
    }

    console.log('[INFO] (main): START  UNITS (nominal: ' + Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount] + '; workers: ' + (units.total - units.harvest) + '): ' + JSON.stringify(units));
    let tick_between_hard_actions = 2;

    // Every tick loops
    // Towers
    let towers_list = [];
//    console.log('[DEBUG] (main): LIST: ' + !(my_room.memory.towers.list) + '; Tick: ' + (Game.time > my_room.memory.towers.next_update));
    if (!my_room.memory.towers.list.length === 0 || (Game.time > Game.rooms[room_name].memory.towers.next_update)) {   // update list of towers
        Game.rooms[room_name].memory.towers.next_update = Game.rooms[room_name].memory.towers.next_update + Game.rooms[room_name].memory.global_vars.update_period.towers;
        let all_towers = Game.rooms[room_name].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        for (let i=0;i<all_towers.length;i++) {
//            console.log('[DEBUG] (main): TOWER' + JSON.stringify(all_towers[i]));
            towers_list.push(all_towers[i].id);
        }
        Game.rooms[global_vars.room_name].memory.towers.list = towers_list;
//        console.log('[INFO] (main): GLOBAL vars: ' + JSON.stringify(Game.rooms[room_name].memory.global_vars));
        if (towers_list.length > 0) Game.rooms[room_name].memory.global_vars.creep_types[Game.spawns[spawn_name].memory.general.status].repair_civilian = 0;
    } else towers_list = Game.rooms[room_name].memory.towers.list

    let towers_energy_full = true;
    // console.log('[DEBUG] (main): TOWERS: ' + towers_list.length);
    if (units.total > 9 || Game.spawns[spawn_name].memory.general.status === 'war')
        for (let i=0;i<towers_list.length;i++) {
            roleTower.run(towers_list[i], units.total);
            // let current_tower = Game.getObjectById(towers_list[i]);
            // //        console.log('[DEBUG] (main): TOWER[' + i + ']' + '; ENR: ' + (current_tower.energy < current_tower.energyCapacity));
            // if (current_tower.energy/current_tower.energyCapacity < 0.65) towers_energy_full = false;
        }
    // Game.rooms[global_vars.room_name].memory.towers.all_full = towers_energy_full;

    // Creeps
    let current_mod = 0;
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        var creep_role = creep.memory.role
        roleStructCreep.run(creep, units);
    }

    if (Game.time % 5 === 0) {
        console.log('[INFO] (main): RUN 5 tickets functions. Time: ' + Game.time);
        creep_helpers.create_creep(units);
    }

    if (Game.time % 10 === current_mod) {  // run every 10 ticks
        console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
//        room_helpers.get_transfer_target();
        room_helpers.define_room_status();
    }

    current_mod = current_mod + tick_between_hard_actions;
    if (Game.time % 10 === current_mod) {  // run every 10 ticks
        console.log('[INFO] (main): RUN 10 tickets functions +' + current_mod + '. Time: ' + Game.time);
        room_helpers.get_repair_defence_target();
    }

    current_mod = current_mod + tick_between_hard_actions;
    if (Game.time % 10 === current_mod) {  // run every 10 ticks
//        console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
//        room_helpers.get_repair_civilianl_target();
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

    if (Game.time % 300 === 0) {
        room_helpers.upgrade_energy_flow(room_name);
    }

    if (Game.time % 1000 === 0) {
        room_helpers.clean_memory();
    }

    // Create first roads
    if (typeof my_room.memory.roads == "undefined") {
        my_room.memory.roads = [];
        var xy_path = room_helpers.create_road(_.extend(my_spawn.pos, {id: my_spawn.id, structureType: 'spawn'}), _.extend(my_spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'}));  // Spawn-Closest Source
        for (i in xy_path) get_struct_obj(xy_path[i][0], xy_path[i][1]);
        room_helpers.create_road(_.extend(global_vars.my_room.controller.pos, {id: my_room.controller.id, structureType: 'controller'}), _.extend(my_room.controller.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'})); // Controller-Closest Source
        // Save in memory important path to build first
        //global_vars.my_room.memory.important_structures = xy_path;
    }

//    console.log('[INFO] (main): FINISH UNITS (nominal: ' + Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount] + '): ' + JSON.stringify(units));

}