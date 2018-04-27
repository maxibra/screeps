var roleStructCreep = require('role.struct_creep');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');
var roleTower = require('struct.tower');
var screepsplus = require('screepsplus');

// Game.creeps['max_new-1'].moveTo(Game.getObjectById('5ad024eac27319698ef58448'))
// Game.spawns['E37N48'].spawnCreep([CLAIM,MOVE,MOVE,MOVE], 'its_my', {memory: {role: 'its_my'; target_pos: {x: 39, y:30, roomName: 'E38N47'}}});

if (typeof Memory.rooms.global_vars === "undefined") {
    Memory.rooms.global_vars = {
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
        update_period: {
            after_war: 150,
            towers: 1000
        },
        age_to_drop_and_die: 10
    }
}

for(var current_room_name in Game.rooms) {
    // Itiliaze spawn memory with creep's metadata
    // if (typeof Game.spawns[spawn_name].memory.general === "undefined") {
    //     Game.spawns[spawn_name].memory.general = {
    //         gen: 0,
    //         index: 0,
    //         status: 'peace',
    //         extensions: 0
    //     };
    // }

    // Initialie the room memory
    if (typeof Memory.rooms[current_room_name].towers === "undefined") {
        Memory.rooms[current_room_name].towers = {
            current: {},
            next_update: Game.time,
        }
    }

    if (typeof Memory.rooms[current_room_name].targets === "undefined") {
        Memory.rooms[current_room_name].targets = {};
    }

    if (typeof Memory.rooms[current_room_name].energy_flow === "undefined") {
        Memory.rooms[current_room_name].energy_flow = {
            sources: Game.rooms[current_room_name].find(FIND_SOURCES).map(x => x.id),
            mineral: {
                id: Game.rooms[current_room_name].find(FIND_MINERALS).map(x => x.id)[0],
                type: Game.rooms[current_room_name].find(FIND_MINERALS).map(x => x.mineralType)[0],
                extractor: false
            },
            dropped: {},
            tombstone: {},
            links: {sources: [], destinations: []},
            containers: {
                source: {},
                other: {}
            }
        }
    };

    if (typeof Memory.rooms[current_room_name].global_vars === "undefined") {
        Memory.rooms[current_room_name].global_vars = {
            status: 'peace',
            finish_war: false,
            age_to_drop_and_die: 20,
            age_to_recreate_miner: 70,
            max_body_cost: 1800,
            screeps_max_amount: {
                peace: 10,
                war: 30,
                repair_defence: 30,
                build: 15,
                nominal: 15
            },
            creep_types: {
                war: {
                    transfer: 0.3,     // max percentage of transfer from total creeps. index is romm's level
                    build: 0.6,        // max percentage of builders from total creeps
                    repair_defence: 0.4,          // max percentage of repair units from total creeps
                    repair_civilian: 0.2,          // max percentage of repair units from total creeps
                    special_carry: 0.3,
                    harvest: {
                        energy: 0.7,
                        mineral: 0.3
                    }
                },
                peace: {
                    transfer: 0.4,     // max percentage of transfer from total creeps. index is romm's level
                    build: 0.3,        // max percentage of builders from total creeps
                    repair_defence: 0.1,          // max percentage of repair units from total creeps
                    repair_civilian: 0.1,          // max percentage of repair units from total creeps
                    special_carry: 0.4,
                    harvest: {
                        energy: 0.7,
                        mineral: 0.3
                    }
                }
            }
        }
    }
}
// console.log('Creeps general: ' + JSON.stringify(spawn.memory.general));

// JSON.stringify(obj)

// var global_vars = Game.rooms[room_name].memory.global_vars;
// var my_spawn = Game.spawns[global_vars.spawn_name];
// var my_room = Game.rooms[global_vars.room_name];

function get_struct_obj(x, y) {
    var stuctures = global_vars.my_room.lookAt(x,y);
    console.log('XY: ' + x + '-' +y + '; STRUCT: ' + JSON.stringify(stuctures));
    for (var s in stuctures) console.log(stuctures[s]);
}

module.exports.loop = function () {
    // act_out = Game.rooms['E38N47'].controller.activateSafeMode()
    // console.log('[DEBUG] (main): SafeMode: ' + act_out)
    var units = {'total': 0};
// 59f1a59182100e1594f3eb84
    //console.log('[DEBUG] (main): MAX Creeps: ' + JSON.stringify(Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount));
    var cur_creeps = Game.creeps ? Game.creeps : {};
    for(let current_room_name in Game.rooms) {
        units[current_room_name] = {
            'total': 0,
            'transfer': 0,
            'build': 0,
            'upgrade': 0,
            'upgrader': 0,
            'repair_defence': 0,
            'repair_civilian': 0,
            'harvest': 0,
            'undefined': 0,
            'long_harvest': 0,
            'claimer': 0,
            'sp_total': 0,
        };
    }

    for (let creep_name in cur_creeps) {
        // cur_creeps[creep_name].memory.stuck = 0;
        let creep_carry = Object.keys(cur_creeps[creep_name].carry);
        splited_name = creep_name.split('-');
        let room_name = cur_creeps[creep_name].room.name;
        units[room_name][cur_creeps[creep_name].memory.role]++;
        units[room_name]['total']++;
        if (cur_creeps[creep_name].memory.special) units[room_name]['sp_total']++;
        units['total']++;
    }

    if (Game.time % 5 === 0) {
        console.log('[INFO] (main): TIME: ' + Game.time + '; BUCKET: ' + Game.cpu.bucket)
        for (let cur_room in Game.rooms) {
            let room_status = Memory.rooms[cur_room].global_vars.status;
            if (units[cur_room]) 
                console.log('[INFO] (main): [' + cur_room + '][' + room_status + '] expected: ' + 
                            Memory.rooms[cur_room].global_vars.screeps_max_amount[room_status] + 
                            '; Workers: ' + (units[cur_room].total-units[cur_room].sp_total-units[cur_room].harvest) + '; ' +
                            '; Special: ' + units[cur_room].sp_total + '; ' +
                            JSON.stringify(units[cur_room]));
        }
    }
    let tick_between_hard_actions = 2;

    // Every tick loops


    // Creeps
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        var creep_role = creep.memory.role
        // if (name === 'E39N49-2-86-300-gn') continue
        roleStructCreep.run(creep, units);
        if (Game.time % 25 === 0 && Object.keys(creep.carry).length === 1) creep.memory.has_minerals = false;
    }

    if (Game.time % 8 === 0) {
        for(var current_spawn_name in Game.spawns) {
            creep_helpers.create_creep(current_spawn_name, units);
        }
    }

    let avoid_rooms = ['E34N46', 'E35N46', 'E36N46', 'E37N47', 'E34N46', 'E33N47']
    for(var current_room_name in Game.rooms) {
        if(avoid_rooms.indexOf(current_room_name) > 0) continue
        
        
        // Memory.rooms[current_room_name].energy_flow.mineral.type = Game.rooms[current_room_name].find(FIND_MINERALS).map(x => x.mineralType)[0]
        // Memory.rooms[current_room_name].energy_flow.sources= Game.rooms[current_room_name].find(FIND_SOURCES).map(x => x.id)
        
        // Towers
        let towers_list = Object.keys(Game.rooms[current_room_name].memory.towers.current);
        let towers_energy_full = true;
        // console.log('[DEBUG] (main)[' + current_room_name + ']: TOWERS: ' + JSON.stringify(towers_list));
        if ((units[current_room_name] && units[current_room_name].total >= 2) || Memory.rooms[current_room_name].global_vars.status === 'war')
            for (let i=0;i<towers_list.length;i++) {
                // console.log('[DEBUG] (main): TOWER[' + i + ']' + ' ID: ' + towers_list[i]);
                roleTower.run(towers_list[i], units[current_room_name].total);
            }

        if (Game.time % 5 === 0) {
            // console.log('[INFO] (main): RUN 5 tickets functions. Time: ' + Game.time);
            // room_helpers.check_create_miner(current_room_name, global_vars.spawn_name, units);
            room_helpers.transfer_link2link(current_room_name);
            room_helpers.verify_all_full(current_room_name);
        }

        let current_mod = 0;
        if (Game.time % 1 === current_mod) {  // run every 10 ticks
            // console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
            //        room_helpers.get_transfer_target(current_room_name);
            room_helpers.define_room_status(current_room_name);
            // dropped_resources = Game.rooms[current_room_name].find(FIND_DROPPED_RESOURCES)
            // if (dropped_resources.length > 0) Game.notify('We Have Dropped Resources in our area: ' + dropped_resources.length);

        }

        current_mod = current_mod + tick_between_hard_actions;
        if (Game.time % 10 === current_mod) {  // run every 10 ticks
            // console.log('[INFO] (main): RUN 10 tickets functions + ' + current_mod + '. Time: ' + Game.time);
            room_helpers.get_build_targets(current_room_name);
            room_helpers.get_repair_defence_target(current_room_name);
            // if (current_room_name === 'E38N47') room_helpers.get_repair_civilianl_target(current_room_name);
        }

        if (Game.time % 10 === 0) {
            // Use terminal to send energy between rooms
            // if (current_room_name === 'E39N49') {
            let cur_terminal_id = Game.rooms[current_room_name].memory.energy_flow.terminal;
            // console.log('[INFO] (main)[' + current_room_name +']: ' + cur_terminal_id);
            if (cur_terminal_id) {
                let cur_terminal = Game.getObjectById(cur_terminal_id);
                let storage_emergency_ration = Memory.rooms.global_vars.storage_emergency_ration;
                let energy2transfer = cur_terminal.store[RESOURCE_ENERGY] - storage_emergency_ration;
                if (energy2transfer > 1000) {
                    cur_terminal.send(RESOURCE_ENERGY, energy2transfer, 'E38N48');
                    // Game.notify(current_room_name + ' Sent ' +  energy2transfer + ' enegry' + ' To E37N48');
                }
            }
        }
        
        if (Game.time % 300 === 0) {
            room_helpers.upgrade_energy_flow(current_room_name);
            roleTower.create_towers_list(current_room_name);
        }
    }

    if (Game.time % 1000 === 0) {
        room_helpers.clean_memory();
    }

    // Create first roads
    // if (typeof my_room.memory.roads == "undefined") {
    //     my_room.memory.roads = [];
    //     var xy_path = room_helpers.create_road(_.extend(my_spawn.pos, {id: my_spawn.id, structureType: 'spawn'}), _.extend(my_spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'}));  // Spawn-Closest Source
    //     for (i in xy_path) get_struct_obj(xy_path[i][0], xy_path[i][1]);
    //     room_helpers.create_road(_.extend(global_vars.my_room.controller.pos, {id: my_room.controller.id, structureType: 'controller'}), _.extend(my_room.controller.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'})); // Controller-Closest Source
    //     // Save in memory important path to build first
    //     //global_vars.my_room.memory.important_structures = xy_path;
    // }

    if (Game.time % 5 === 0) screepsplus.collect_stats();

//    console.log('[INFO] (main): FINISH UNITS (nominal: ' + Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount] + '): ' + JSON.stringify(units));

}