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
        base: [WORK,WORK,WORK,WORK,WORK,MOVE,MOVE]
    }
}

function body_cost(body) {
    var cost = 0;
    _.forEach(body, function(part) { cost += BODYPART_COST[part]; });
    return cost;
}

function remote_target(room_name) {
    // Object of rooms with remote targets
    let target = false;
    switch (room_name) { 
        case 'E34N47':  
            target = ['E32N47',];
            break;
        case 'E33N47':  
            target = ['E32N48', 'E32N49'];
            break;
        case 'E37N48':
            target = ['E37N49']; //, 'E36N48']; // 'E34N46'];
            break;
        // case 'E38N47':
        //     target = ['E38N46',]; // 'E34N46'];
        //     break;
        case 'E38N48':
            target = ['E38N49',]; // 'E34N46'];
            break;
    }
    return target;
}

function special_harvester_memory(room_name) {
    // ID's of destination inside homeland of remote harvesters
    let target = false;
    switch (room_name) { 
        case 'E34N47':  
            target = ['5afe0270ff9d380d22e28298', // north link of of E33N47
                      '5af77c2caba2f708b74580b4', '5af7fb6d72bccd0cc9c29cf7', '5afc6f3612e8d50cf8eb8831'];  // containers of E33N47
            break;
        case 'E33N47':  
            target = ['5afe0270ff9d380d22e28298', // north link of of E33N47
                      '5af77c2caba2f708b74580b4', '5af7fb6d72bccd0cc9c29cf7', '5afc6f3612e8d50cf8eb8831'];  // containers of E33N47
            break;
        case 'E37N48':
            target = ['5acc524f6bec176d808adb71',];
            break;
        case 'E38N47':
            target = ['5adfbd7de9560f0a300272ce',];
            break;
        case 'E38N48':
            target = ['5ae4db5bcb5e3209ac04979b', '5ad024eac27319698ef58448'];
        break;
    }
    return {source_id: target, homeland: room_name};
}

//  Game.spawns['max_E37N48'].spawnCreep([MOVE,MOVE,MOVE,CLAIM], 'its_my', {role: 'its_my'})
var creep_helpers = {
    create_creep: function(spawn_name, units) {
        let my_spawn = Game.spawns[spawn_name];
        let room_name = Game.spawns[spawn_name].room.name
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let my_room = Game.rooms[room_name];
        let new_room_creeps = 0;
        let attacker_creeps = 0;
        let lng_hrvst_creeps = 0;
        let energy_helpers = 0;
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
        
        let avoid_remote = !(room_name === 'E38N48' || room_name === 'E37N48' || room_name === 'E34N47' || room_name === 'E33N47'); // || room_name === 'E38N47')

        
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
                body: (my_room.energyCapacityAvailable > 2050) ? [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY] :
                                                                 [MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY],
                memory: {},
                name_prefix: 'upgrader_' + room_name,
                amount: 1
            },
            energy_miner: {
                body: [MOVE,MOVE,WORK,WORK,WORK,WORK,WORK],
                memory: {},
                name_prefix: 'nrg_mnr_' + room_name,
                amount: Object.keys(my_room.memory.energy_flow.containers.source).length
                // amount: 1
            },
            remote_energy_miner: {
                body: [MOVE,MOVE,WORK,WORK,WORK],
                memory: {stuck: 0},
                name_prefix: 'rmt_nrg_mnr' + room_name,
                target: remote_target(room_name),
                // amount: Object.keys(Memory.rooms[room_name].energy_flow.containers.source).length,
                avoid: avoid_remote
                // amount: 1
            },
            // transfer: {
            //     body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
            //     memory: {},
            //     name_prefix: 'carier', 
            //     amount: 1
            // },
            mineral_miner: {
                // body: [MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY],
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                memory: {},
                name_prefix: 'mnrl_mnr_' + room_name,
                amount: 1,
                avoid: !(my_room.memory.energy_flow.mineral.extractor)
            },
            remote_harvest: {
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                // body: [MOVE,WORK,CARRY],
                memory: special_harvester_memory(room_name),
                name_prefix: 'rmt_hrvst_' + room_name,
                amount: 2,
                target: remote_target(room_name),
                avoid: avoid_remote
            // }
            },
            remote_claimer: {
                body: [MOVE,MOVE,CLAIM,CLAIM],
                memory: special_harvester_memory(room_name),
                name_prefix: 'rmt_claimer_' + room_name,
                amount: 1,
                target: remote_target(room_name),
                avoid: avoid_remote
            },
            re_transfer: {
                // body: [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                memory: {},
                name_prefix: 're_transfer_' + room_name,
                amount: 1,
                avoid: !(room_name === 'E34N47')
            }
        }
        
        //  **** New implementations of special creeps
        // console.log('[INFO] (create_creep)[' + room_name + ']: SPECIAL cond: ' + (universal_creeps >= room_vars.screeps_max_amount[room_vars.status]))

        if (universal_creeps >= room_vars.screeps_max_amount[room_vars.status]) {
            for (let creep_type in special_creeps) {
                // console.log('CREEP Type: ' + creep_type);
                current_obj = special_creeps[creep_type];
                
                // Check condition to avoid the current type
                if (current_obj.avoid || current_obj.amount === 0 || 
                    (creep_type == 'mineral_miner' && Game.getObjectById(my_room.memory.energy_flow.mineral.id).mineralAmount === 0)) continue;
                // if (creep_type === 'remote_harvest') console.log('(create_creep_[' + room_name + '] WAR condition: ' + remote_target(room_name).map(x => Memory.rooms[x].global_vars.status).indexOf('war'))
                let cur_remote_target = remote_target(room_name); 
                if ((creep_type === 'remote_harvest' || creep_type === 'remote_claimer' || creep_type === 'remote_energy_miner') && cur_remote_target && cur_remote_target.map(x => Memory.rooms[x].global_vars.status).indexOf('war') > -1) {
                    console.log('(create_creep) [' + room_name + '] Remote rooms in WAR. Stop creating of remote_harvester and remote_claimer in the room: ' + cur_remote_target.map(x => Memory.rooms[x].global_vars.status));
                    continue;
                }
                
                let targets = (current_obj.target) ? current_obj.target : [false,];
                // console.log('[INFO] (create_creep)[' + room_name + ']: TARGETS: ' + JSON.stringify(targets))
                for (let t in targets) {
                    let current_amount = (creep_type === 'remote_energy_miner') ? Object.keys(Memory.rooms[targets[t]].energy_flow.containers.source).length :
                                                                                  current_obj.amount;
                    for (let i=1; i<=current_amount; i++) {
                        // console.log('(create_creep)[' + room_name + '] FROM TARGETS: ' + JSON.stringify(targets));
                        if (targets[t] && creep_type === 'remote_claimer' && ((Memory.rooms[targets[t]].endReservation - Game.time) > 4000)) {
                            console.log('(create_creep)[' + room_name + '] Controller reservation longer than 4000. skipped');
                            continue;
                        }
                        
                        current_new_name = (targets[t]) ? current_obj.name_prefix + '_' + targets[t] + '-' + i + '-sp' :
                                                 current_obj.name_prefix + '-' + i + '-sp';
                                                 
                        // console.log('[INFO] (create_creep)[' + room_name + ']: Name: ' + current_new_name)

                        if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 ) {
                            creep_name = current_new_name;
                            creep_memory = current_obj.memory;
                            if (targets[t]) creep_memory.far_target = targets[t];
                            creep_memory['role'] = creep_type;
                            creep_memory['special'] = creep_type;    // needed to prevent role changing after harvesting
                            current_body = current_obj.body;
                            add_body = false;       // needed to prevent dynamic body creation
                            break;                        
                        }
                    }
                }
            }           
        }
        // **** Finish special
        
        // creation of additional creeps for expansion
        if (room_name === 'E34N47' && universal_creeps >= 3) {
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
        console.log('[DEBUG] (create_creep): [' + spawn_name + '] Universal: ' + universal_creeps + '; Max:' + room_vars.screeps_max_amount[room_vars.status] + '; Add body: ' + add_body)
        if (universal_creeps === 0  || !add_body) {// == 0 && my_spawn.memory.general.status != 'peace'){// || creeps_names.length < 3) { // It's no harversters create a minimum body
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
                if (my_room.memory.towers && my_room.memory.towers.current[target.id] === creep.id) my_room.memory.towers.current[target.id] = false;
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