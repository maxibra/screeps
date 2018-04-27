var global_vars = Memory.rooms.global_vars;

var creep_body = {
    general: {
        base: [WORK,CARRY,MOVE],
        add: [WORK,CARRY,MOVE]
    },
    special_carry: {
        base: [CARRY,CARRY,MOVE],
        add: [CARRY,CARRY,MOVE]
    },
    special_upgrade: {
        base: [WORK,WORK,MOVE],
        add: [WORK,CARRY,MOVE]
    },
    special_miner: {
        base: [WORK,WORK,WORK,WORK,WORK,MOVE]
    }
}

function body_cost(body) {
    var cost = 0;
    _.forEach(body, function(part) { cost += BODYPART_COST[part]; });
    return cost;
}

//  Game.spawns['max_E38N48'].spawnCreep([MOVE,MOVE,MOVE,CLAIM], 'max_new-20', {role: 'claimer'})
var creep_helpers = {
    create_creep: function(spawn_name, units) {
        let my_spawn = Game.spawns[spawn_name];
        let room_name = Game.spawns[spawn_name].room.name
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let my_room = Game.rooms[room_name];
        let new_room_creeps = 1;
        let attacker_creeps = 0;
        let lng_hrvst_creeps = 0;
        let energy_helpers = 2;
        let upgraders = 0;
        let create_special = false;

        let current_creeps = Game.creeps;
        let creeps_names = Object.keys(current_creeps);
        let creep_memory = {role: 'harvest', target_id: false, stuck: 0};
        let current_creep_types = room_vars.creep_types[room_vars.status];
        let name_special = 'gn';
        let current_body = creep_body.general.base;
        var add_body = creep_body.general.add;
        let creep_name = '';
        let universal_creeps = units[room_name]['total'] - units[room_name]['sp_total'];
        
        let special_creeps = {
            // claimer: {
            //     // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
            //     body:  [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
            //     memory: {},
            //     name_prefix: 'max_new',
            //     amount: 4
            // },   
            // attacker: {
            //     body:  [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH],
            //     memory: {},
            //     name_prefix: 'attacker',
            //     amount: 0
            // },   
            // energy_helper: {
            //     body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
            //     memory: {},
            //     name_prefix: 'energy_helper',
            //     amount: 1
            // },   
            upgrader: {
                body: [MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY],
                memory: {},
                name_prefix: 'upgrader_' + room_name,
                amount: 1
            },
            energy_miner: {
                body: [MOVE,WORK,WORK,WORK,WORK,WORK],
                memory: {},
                name_prefix: 'nrg_mnr' + room_name,
                amount: Object.keys(my_room.memory.energy_flow.containers.source).length
                // amount: 1
            },
            // transfer: {
            //     body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
            //     memory: {},
            //     name_prefix: 'carier', 
            //     amount: 1
            // },
            mineral_miner: {
                body: [MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY],
                memory: {},
                name_prefix: 'mnrl_mnr_' + room_name,
                amount: 1,
                avoid: !(my_room.memory.energy_flow.mineral.extractor)
            }
            // remote_harvest: {
            //     body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
            //     memory: {
            //         harvester_type: 'move_away', 
            //         far_target: my_room.memory.energy_flow.long_harvest[0],
            //         homeland: room_name,
            //         homeland_target: my_room.controller.id
            //     },
            //     name_prefix: 'rmt_hrvst_' + room_name,
            //     amount: 1,
            //     avoid: !(room_name === ')
            // }
        }
        
        //  **** New implementations of special creeps
        if (universal_creeps >= room_vars.screeps_max_amount[room_vars.status]) {
            for (let creep_type in special_creeps) {
                current_obj = special_creeps[creep_type];
                if (current_obj.avoid) continue;
                for (let i=1; i<=current_obj.amount; i++) {
                    current_new_name = current_obj.name_prefix + '-' + i + '-sp';
                    if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 ) {
                        creep_name = current_new_name;
                        creep_memory = current_obj.memory;
                        creep_memory['role'] = creep_type;
                        creep_memory['special'] =  creep_type;    // needed to prevent role changing after harvesting
                        current_body = current_obj.body;
                        add_body = false;       // needed to prevent dynamic body creation
                        break;                        
                    }
                }
            }           
        }
        // **** Finish special
        
        // creation of additional creeps for expansion
        if (room_name !== 'E34N47' && universal_creeps >= 3) {
            let new_memory = {role: 'claimer'};
            for (let i=1; i<=new_room_creeps; i++) {
                current_new_name = 'max_new-' + i;
                // console.log('[DEBUG] (create_creep): CURRENT NAME: ' + current_new_name)
                if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 ) {
                    creep_name = current_new_name;
                    creep_memory = new_memory;
                    // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                    current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                    // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]
                    // current_body = [MOVE,MOVE,WORK,WORK,CARRY,CARRY];
                    add_body = false;
                    break;
                }
            }
            new_memory = {role: 'attacker'};
            for (let i=1; i<=attacker_creeps; i++) {
                current_new_name = 'attacker-' + i;
                // console.log('[DEBUG] (create_creep): CURRENT NAME: ' + current_new_name)
                if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 ) {
                    creep_name = current_new_name;
                    creep_memory = new_memory;
                    current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH];
                    // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]
                    // current_body = [MOVE,MOVE,WORK,WORK,CARRY,CARRY];
                    add_body = false;
                    break;
                }
            }
            new_memory = {role: 'energy_helper'};
            for (let i=1; i<=energy_helpers; i++) {
                current_new_name = 'energy_helper-' + i;
                // console.log('[DEBUG] (create_creep): CURRENT NAME: ' + current_new_name)
                if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 ) {
                    creep_name = current_new_name;
                    creep_memory = new_memory;
                    // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                    current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]
                    add_body = false;
                    break;
                }
            }            
        }
        
        if (universal_creeps >= 3 && my_room.memory.energy_flow.long_harvest) {
            let new_memory = {
                role: 'long_harvest', 
                harvester_type: 'move_away', 
                far_target: my_room.memory.energy_flow.long_harvest[0],
                homeland: room_name,
                special: 'long_harvest',
                homeland_target: my_room.controller.id
            };
            for (let i=1; i<=lng_hrvst_creeps; i++) {
                current_new_name = 'lng_hrvst-' + room_name + '-' + i + '-sp';
                // console.log('[DEBUG] (create_creep): CURRENT NAME: ' + current_new_name)
                if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 ) {
                    creep_name = current_new_name;
                    creep_memory = new_memory;
                    current_body = [MOVE,WORK,CARRY];
                    add_body = false;
                    if (Memory.creeps[current_new_name] && Memory.creeps[current_new_name].memory) delete Memory.creeps[current_new_name].memory
                    break;
                }
            }
        }

        // **** LOG
        // console.log('[DEBUG] (create_creep)[' + spawn_name + ']: Creeps: ' +  universal_creeps + '; Must Be: ' + room_vars.screeps_max_amount[room_vars.status] + '; SPAWING: ' + my_spawn.spawning + '; no needed a New: ' + (creep_name === ''));
        // ********

        // **** if creep_name different from '' is mean create special
        if ((creep_name === '' && (universal_creeps >= room_vars.screeps_max_amount[room_vars.status])) || my_spawn.spawning) return;

        // if (my_room.controller.level > 1) {     // You can create special creeps
        // if (units['special_carry']/units['total'] < current_creep_types.special_carry) { // Check creation of special carry
        //         console.log('[INFO] (create_creep): SPECIAL_Units: ' + units['special_carry'] + ' [' + current_creep_types.special_carry + ']');
        //         creep_memory.special = 'special_carry';
        //         creep_memory.role = 'transfer';
        //         name_special = 'sc';
        //         current_body = creep_body.special_carry.base;
        //         add_body = creep_body.special_carry.add;
        // }

        // if (my_spawn.memory.general.create_miner) {
        //     console.log('[INFO] (create_creep): Miner for: ' + my_spawn.memory.general.create_miner);
        //     creep_memory = {
        //         special: 'special_miner',
        //         role: 'miner',
        //         target_id: my_spawn.memory.general.create_miner
        //     };
        //     name_special = 'sm';
        //     current_body = creep_body.special_miner.base;
        //     add_body = false;
        // }
        // }
        if ((universal_creeps < 2 && room_vars.screeps_max_amount[room_vars.status] > 2) || !add_body) {// == 0 && my_spawn.memory.general.status != 'peace'){// || creeps_names.length < 3) { // It's no harversters create a minimum body
            // Do nothing
        } else {                      // Create most possible strong body
            let possible_body = current_body.concat(add_body);
            let possible_body_cost = body_cost(possible_body);
            for (i=2;possible_body_cost <= Game.rooms[room_name].energyCapacityAvailable;i++) {
                current_body = possible_body;
                possible_body = possible_body.concat(add_body);
                if (i%2 == 0) possible_body.push(MOVE);
                possible_body_cost = body_cost(possible_body);
                if (possible_body_cost > room_vars.max_body_cost) break;
            }
        }

        let current_body_cost = body_cost(current_body);
        if (creep_name === '' ) creep_name = spawn_name.substring(4) + '-' + my_spawn.memory.general.index + '-' + my_spawn.memory.general.gen + '-' + (current_body_cost/10) + '-' + name_special;

        if (current_body_cost > Game.rooms[room_name].energyAvailable) {
            console.log('[DEBUG] (create_creep): [' + spawn_name + '] WAITing to create creep ' + creep_name + ': ' +  Game.rooms[room_name].energyAvailable + '/' + current_body_cost);
            return;
        }

        let exit_code = Game.spawns[spawn_name].spawnCreep(current_body, creep_name, {memory: creep_memory});
        // console.log('[DEBUG] (create_creep): Type: ' + my_spawn.memory.general.creeps_max_amount + '; Max amount: ' + JSON.stringify(room_vars.screeps_max_amount)); //room_vars.screeps_max_amount[my_spawn.memory.general.creeps_max_amount]);
        if ( exit_code === OK) {
            let new_index = (my_spawn.memory.general.index + 1) % room_vars.screeps_max_amount[room_vars.status];
            my_spawn.memory.general.index = new_index;
            my_spawn.memory.general.gen = ((new_index === 0) ? (my_spawn.memory.general.gen + 1) % 100 : my_spawn.memory.general.gen);;
            console.log('[INFO] (create_creep)[' + spawn_name + ']: Spawning new harvester: ' + creep_name + '; Body: ' + current_body + '(' + add_body + ')' + '; Mem: ' + JSON.stringify(creep_memory));
        } else console.log('[ERROR] (create_creep)[' + spawn_name + ']: Failed to create creep ' + creep_name + ': ' + exit_code + '; Body cost: ' + current_body_cost + '; Avalable energy: ' + my_room.energyAvailable + '(' + my_room.energyAvailable);
    },
    drop_energy2container: function(creep) {
        if (creep.memory.role == 'dropper') {

        } else {
            //closest_containers = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_CONTAINER && object.store[RESOURCE_ENERGY] < object.storeCapacity)});

//            creep.memory.target_id = closest_containers.id;
//            creep.memory.role = 'dropper';
        }
    },
    most_creep_action_results: function(creep, target, action_res, creep_role) {
        let my_room = Game.rooms[creep.room.name];

        switch(action_res) {
            case OK:
                creep.memory.target_id = target.id;
                if (my_room.memory.towers.current[target.id] === creep.id) my_room.memory.towers.current[target.id] = false;
                break;
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, global_vars.moveTo_ops);
                break;
            case ERR_FULL:
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
                creep.memory.role = 'undefined';
                if (my_room.memory.towers.current[target.id] === creep.id) my_room.memory.towers.current[target.id] = false;
            default:
//                console.log('[WARN] (most_creep_action_results)[' + creep.name + ']: ' + creep_role + ': NO action for result ' + action_res)
//                 if (creep.memory.role == 'transfer' && creep.memory.target_id != my_spawn.id && my_spawn.energy < my_spawn.energyCapacity) {
//                     targets = my_room.find(FIND_STRUCTURES, {filter: object => object.energy < object.energyCapacity});
// //                    console.log('[DEBUG] (most_creep_action_results)[' + creep.name + ']: ' + 'Target is changed');
//                     if (targets[0]) creep.memory.target_id = targets[0].id;
//                 } else {
                creep.memory.target_id = false;
                creep.memory.role = 'undefined';
            // }
        }
    }
};

module.exports = creep_helpers;