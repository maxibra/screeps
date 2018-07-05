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

function upgrader_body(room_name) {
    let room_level = Game.rooms[room_name].controller.level;
    if (room_name === 'E36N48' || room_name === 'E34N47' || room_name === 'E33N47' || room_name === 'E32N49') room_level = 8;
    else if (room_name === 'E38N47')  room_level = 8;
    else if (room_name === 'E28N48') room_level = 8;

    switch (room_level) {
        case 8: 
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY];  // 15/T
            break;
        case 10:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY];   // upgrade = 10/T
            break;
        case 11:
            body = [MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY]; // upgarde = 8/T (2400 per 300T)
            break;
        case 20:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY]; // 20/T
            break;
        case 25:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY]; // 25/T
            break;
        case 40:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY];   // upgrade = 10/T carry = 200
            break;
        default:
            body = [MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY];
    }
    return body;
}

function remote_target(room_name) {
    // Object of rooms with remote targets
    let target = false;
    switch (room_name) { 
        case 'E28N48':  
            target = ['E27N48', 'E29N48', 'E27N47', 'E29N49'];
            break;
        case 'E32N49':  
            target = ['E31N49',]; // 'E33N49'];
            break;
        case 'E33N47':  
            target = ['E32N48', 'E31N48', 'E32N47'];
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

function remote_harvester_info(room_name) {
    // ID's of destination inside homeland of remote harvesters
    let info_object = {};
    switch (room_name) {
        case 'E27N47': 
            info_object = {
                homeland_destinations: ['5b34d0a3e6e0fa316db08a31',],
                amount: 1
            }
            break;
        case 'E27N48': 
            info_object = {
                homeland_destinations: ['5b34d0a3e6e0fa316db08a31',],
                amount: 1
            }
            break;
        case 'E29N48': 
            info_object = {
                homeland_destinations: ['5b2fd3f9c656780b1fee6911', '5b2cc739f727462af9e9828a'],
                amount: 2
            }
            break;
        case 'E29N49':
            info_object = {
                homeland_destinations: ['5b2fd3f9c656780b1fee6911', '5b2cc739f727462af9e9828a'],
                amount: 3
            }
            break;
        case 'E32N47': 
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5af77c2caba2f708b74580b4', '5af7fb6d72bccd0cc9c29cf7', '5afc6f3612e8d50cf8eb8831'],
                amount: 1
            }
            break;
        case 'E32N48': 
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5af77c2caba2f708b74580b4', '5af7fb6d72bccd0cc9c29cf7', '5afc6f3612e8d50cf8eb8831'],
                amount: 2
            }
        case 'E31N48': 
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5af77c2caba2f708b74580b4', '5af7fb6d72bccd0cc9c29cf7', '5afc6f3612e8d50cf8eb8831'],
                amount: 4
            }
            break;      
        case 'E31N49': 
            info_object = {
                homeland_destinations: ['5b1a42e409384a778ed5e8f4', '5b153b87c5612c1429ec169b'],
                amount: 1
            }
            break;             
        case 'E37N49': 
            info_object = {
                homeland_destinations: ['5b09ba8ca6affe14523f5310', '5b0dd640c5612c1429e91c8a', '5acc524f6bec176d808adb71'],
                amount: 1
            }
            break;
        case 'E38N49': 
            info_object = {
                homeland_destinations: ['5ae4db5bcb5e3209ac04979b', '5affb81b83717b6924fc5d49'],
                amount: 2
            }
            break;
        // case 'E28N48':
        //     target = ['5b2fd3f9c656780b1fee6911', '5b2cc739f727462af9e9828a'];
        //     break;
        // case "E32N49":
        //     target = ['5b1a42e409384a778ed5e8f4', '5b153b87c5612c1429ec169b'];
        //     break;
        // case 'E33N47':  
        //     target = ['5b0152f1ff0838345ccf8ae0', '5af77c2caba2f708b74580b4', '5af7fb6d72bccd0cc9c29cf7', '5afc6f3612e8d50cf8eb8831'];  // containers of E33N47
        //     break;
        // case 'E37N48':
        //     target = ['5b09ba8ca6affe14523f5310', '5b0dd640c5612c1429e91c8a', '5acc524f6bec176d808adb71'];
        //     break;
        // case 'E38N48':
        //     target = ['5ae4db5bcb5e3209ac04979b', '5affb81b83717b6924fc5d49']; 
        //     break;
    }
    return info_object;
}

function is_remote_room_in_war(room_name) {
    let remote_rooms = remote_target(room_name);
    let its_war = false;
    
    // console.log('(creep_helpers.is_remote_room_in_war) [' + room_name + '] Remote rooms' + JSON.stringify(remote_rooms));
    for (let r in remote_rooms) {
        if (Memory.rooms[remote_rooms[r]] && Memory.rooms[remote_rooms[r]].global_vars && Memory.rooms[remote_rooms[r]].global_vars.status === 'war') {
            its_war = remote_rooms[r];
            break;
        } 
    }
    return its_war;
}

//  Game.spawns['max_E37N48'].spawnCreep([MOVE,MOVE,MOVE,CLAIM], 'its_my', {role: 'its_my'})
var creep_helpers = {
    create_creep: function(spawn_name, units) {
        let my_spawn = Game.spawns[spawn_name];
        let room_name = Game.spawns[spawn_name].room.name
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let my_room = Game.rooms[room_name];
        let new_room_creeps = 0;
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
        
        let avoid_remote = !(room_name === 'E33N47' || room_name === 'E37N48' || room_name === 'E38N48' || room_name === 'E28N48' || room_name === 'E32N49');
        
        let remote_room_in_war = is_remote_room_in_war(room_name)
        // if (room_name === 'E28N48') console.log('(creep_helpers.create_creep) [' + room_name + '] In WAR: ' + remote_room_in_war);

        // !!!! Order of special_creeps is an order of creep's creation. Upper will be created first 
        let special_creeps = {
            // claimer: {
            //     // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
            //     body:  [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
            //     memory: {},
            //     name_prefix: 'max_new',
            //     amount: 4
            // },   
            attacker: {
                body:  [MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,HEAL],
                memory: {room_in_war: remote_room_in_war},
                name_prefix: 'attacker_' + room_name,
                amount: 1,
                avoid: !(remote_room_in_war)
            },
            energy_miner: {
                body: [MOVE,MOVE,WORK,WORK,WORK,WORK,WORK],
                name_prefix: 'nrg_mnr_' + room_name,
                amount: Object.keys(my_room.memory.energy_flow.containers.source).length
                // amount: 1
            },   
            upgrader: {
                body: upgrader_body(room_name),
                amount: 1,
                // avoid: (room_name === 'E32N49')
            },
            remote_energy_miner: {
                // body: [MOVE,MOVE,WORK,WORK,WORK],
                body: [MOVE,MOVE,WORK,WORK,WORK,WORK,WORK],
                memory: {stuck: 0},
                name_prefix: 'rmt_nrg_mnr' + room_name,
                rmt_targets: remote_target(room_name),
                // amount: ((Memory.rooms[creep.memory.far_target]) ? Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.source).length : 0),
                avoid: avoid_remote
                // amount: 1
            },
            remote_harvest: {
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // Carry: 750
                // body: [MOVE,WORK,CARRY],
                name_prefix: 'rmt_hrvst_' + room_name,
                rmt_targets: remote_target(room_name),
                avoid: avoid_remote
            // }
            },
            remote_claimer: {
                body: [MOVE,MOVE,CLAIM,CLAIM],
                name_prefix: 'rmt_claimer_' + room_name,
                amount: 1,
                rmt_targets: remote_target(room_name),
                avoid: avoid_remote
            },
            lab_assistent: {
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 800
                body: [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 300
                amount: 0,
                // avoid: (Object.keys(my_room.memory.labs.reagent).length === 0)
                avoid: !(room_name === 'E39N49')
            },   
            energy_helper: {
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 500
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 1000
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry:1500
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 2K
                name_prefix: 'energy_helper_' + room_name,
                amount: 0,
                avoid: !(room_name === 'E37N48')
            },
            // transfer: {
            //     body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
            //     memory: {},
            //     name_prefix: 'carier', 
            //     amount: 1
            // },
            mineral_miner: {
                // body: [MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY],
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                name_prefix: 'mnrl_mnr_' + room_name,
                amount: 1,
                avoid: (!(my_room.memory.energy_flow.mineral.extractor && Game.getObjectById(my_room.memory.energy_flow.mineral.id).mineralAmount > 0) || room_name === 'E39N49')
            },
            re_transfer: {
                // body: [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],   // CARRY: 500
                amount: 0,
                avoid: !(room_name === 'E38N48' || room_name === 'E37N48')    // Fake room name
            },
            energy_shuttle: {
                // body: [MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 400
                body: [MOVE,MOVE,CARRY,CARRY,CARRY,CARRY], // carry: 200
                amount: 0,
                avoid: !(room_name === 'E38N47')
            }
            // mineral_shuttle: {
            //     body: [MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 400
            //     amount: 1,
            //     avoid: !(Game.getObjectById(my_room.memory.energy_flow.mineral.id).mineralAmount === 0 &&
            //              my_room.storage &&
            //              my_room.terminal.store[my_room.memory.energy_flow.mineral.id] < Memory.rooms.global_vars.minerals.minimum_send_room)
            // }
        }
        
        //  **** New implementations of special creeps
        // console.log('[INFO] (create_creep)[' + room_name + ']: SPECIAL cond: ' + (universal_creeps)); // >= room_vars.screeps_max_amount[room_vars.status]))

        if (universal_creeps >= room_vars.screeps_max_amount[room_vars.status]) {
            let cur_special_creeps = (units[room_name]['energy_miner'] >= Object.keys(my_room.memory.energy_flow.containers.source).length) ?
                                                special_creeps :
                                                {'energy_miner': special_creeps['energy_miner']};
            // console.log('(create_creep) [' + room_name + '] Energy miners: ' + units[room_name]['energy_miner'] + '; Source containers: ' + Object.keys(my_room.memory.energy_flow.containers.source).length);
            let need2cretae_creep_type = false;
            for (let creep_type in cur_special_creeps) {
                // console.log('CREEP Type: ' + creep_type);
                current_obj = cur_special_creeps[creep_type];
                current_name_prefix = (current_obj.name_prefix) ? current_obj.name_prefix : (creep_type + '_' + room_name);

                // Check condition to avoid the current type
                if (current_obj.avoid || current_obj.amount === 0) {
                    // if (room_name === 'E33N47') console.log('(create_creep) [' + room_name + '] Avoid unit ' + creep_type + '; Avoid condition: ' + current_obj.avoid + '; Expected amount: ' + current_obj.amount);
                    continue;
                }
                let cur_remote_target = remote_target(room_name); 

                // if (creep_type === 'remote_harvest') console.log('(create_creep_[' + room_name + '] Remote: ' + JSON.stringify(cur_remote_target));//.map(x => Memory.rooms[x])));
                // for (let d in cur_remote_target)
                //     console.log('(create_creep)[' + cur_remote_target[d] + '] Memory: ' + JSON.stringify(Memory.rooms[cur_remote_target[d]]));

                if ((creep_type === 'remote_harvest' || creep_type === 'remote_claimer' || creep_type === 'remote_energy_miner') && cur_remote_target && (cur_remote_target.map(x => (Memory.rooms[x] && Memory.rooms[x].global_vars && Memory.rooms[x].global_vars.status)).indexOf('war') > -1)) {
                    console.log('(create_creep) [' + room_name + '] Remote rooms in WAR. Stop creating of remote_harvester and remote_claimer in the room: ' + cur_remote_target.map(x => Memory.rooms[x].global_vars.status));
                    // continue;
                }

                let rmt_targets = (current_obj.rmt_targets) ? current_obj.rmt_targets : [false,];    // false is for moke of intra room special creeps
                let rmt_harvester_obj = false;
                let current_creep_memory = (current_obj.memory) ? current_obj.memory : {};
                // console.log('[INFO] (create_creep)[' + room_name + ']: Remote TARGETS: ' + JSON.stringify(rmt_targets))
                for (let t in rmt_targets) {
                    let remote_room = rmt_targets[t];
                    let creeps_amount;
                    if (creep_type === 'remote_energy_miner') {
                        creeps_amount = (Memory.rooms[remote_room] && Memory.rooms[remote_room].energy_flow) ? Object.keys(Memory.rooms[remote_room].energy_flow.containers.source).length : 0;
                    } else if (creep_type === 'remote_harvest') {
                        rmt_harvester_obj = remote_harvester_info(remote_room);
                        // console.log('(create_creep)[' + room_name + '] Remote (' + remote_room +') harvester info: ' + JSON.stringify(rmt_harvester_obj));
                        creeps_amount = rmt_harvester_obj.amount;
                        current_creep_memory = {
                            source_id: rmt_harvester_obj.homeland_destinations,
                            homeland: room_name
                        }
                    } else {
                        creeps_amount = current_obj.amount;
                    }

                    for (let i=1; i<=creeps_amount; i++) {
                        // console.log('(create_creep)[' + room_name + '] FROM TARGETS: ' + JSON.stringify(rmt_targets));
                        if (remote_room && creep_type === 'remote_claimer' && ((Memory.rooms[remote_room] && Memory.rooms[remote_room].endReservation - Game.time) > 4000)) {
                            console.log('(create_creep)[' + room_name + '] Controller reservation longer than 4000. skipped');
                            continue;
                        }
                        
                        current_new_name = (remote_room) ? current_name_prefix + '_' + remote_room + '-' + i + '-sp' :
                                                 current_name_prefix + '-' + i + '-sp';
                                                 
                        // if (room_name == 'E28N48') console.log('[INFO] (create_creep-Special)[' + room_name + ']: Name: ' + current_new_name + '; Need to create: ' + (Object.keys(current_creeps).indexOf(current_new_name) === -1))

                        if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 ) {
                            creep_name = current_new_name;
                            creep_memory = current_creep_memory;
                            if (remote_room) creep_memory.far_target = remote_room;
                            creep_memory['role'] = creep_type;
                            creep_memory['special'] = creep_type;    // needed to prevent role changing after harvesting
                            current_body = current_obj.body;
                            add_body = false;       // needed to prevent dynamic body creation
                            need2cretae_creep_type = true
                            break;                        
                        } else if (creep_type === 'attacker') console.log('(create_creep)[' + room_name + '] Remote harvester exists: ' + current_new_name + '; expected amount: ' + creeps_amount);
                    }
                    if (need2cretae_creep_type) break;
                }
                if (need2cretae_creep_type) break;
            }           
        }
        // **** Finish special
        
        // creation of additional creeps for expansion
        if (room_name === 'E32N49'  && universal_creeps >= 3) {
            let new_memory = {role: 'claimer'};
            for (let i=1; i<=new_room_creeps; i++) {
                current_new_name = 'max_new-' + i;
                // console.log('[DEBUG] (create_creep): CURRENT NAME: ' + current_new_name)
                if ( Object.keys(current_creeps).indexOf(current_new_name) === -1 && Memory.rooms['E31N49'] === 'peace') {
                    creep_name = current_new_name;
                    creep_memory = new_memory;
                    // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                    current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  // carry: 400
                    // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]
                    // current_body = [MOVE,MOVE,WORK,WORK,CARRY,CARRY];
                    add_body = false;
                    break;
                }
            }
        }
        

        // **** LOG
        // console.log('[DEBUG] (create_creep)[' + spawn_name + ']: Creeps: ' +  universal_creeps + '; Must Be: ' + room_vars.screeps_max_amount[room_vars.status] + '; SPAWING: ' + my_spawn.spawning + '; no needed a New: ' + (creep_name === ''));
        // ********

        // **** if creep_name different from '' is mean create special
        if ((creep_name === '' && (universal_creeps >= room_vars.screeps_max_amount[room_vars.status])) || my_spawn.spawning) return;

        let max_body_cost = ((universal_creeps === 0 || !add_body) && (Game.rooms[room_name].energyAvailable < room_vars.max_body_cost)) ? Game.rooms[room_name].energyAvailable : room_vars.max_body_cost;
        let possible_body = current_body;
        let possible_body_cost = body_cost(possible_body);
        if (room_name === 'E37N48' ) console.log('[DEBUG] (create_creep): [' + spawn_name + '] Universal: ' + universal_creeps + '; Max:' + room_vars.screeps_max_amount[room_vars.status] + '; Add body: ' + add_body + '; Max body cost: ' + max_body_cost + '; Current body:' + current_body)

        for (i=2;possible_body_cost <= Game.rooms[room_name].energyCapacityAvailable;i++) {
            current_body = possible_body;
            possible_body = possible_body.concat(add_body);
            if (i%2 == 0) possible_body.push(MOVE);
            possible_body_cost = body_cost(possible_body);
            if (possible_body_cost > max_body_cost) break;
        }

        let current_body_cost = body_cost(current_body);
        if (room_name === 'E37N48' ) console.log('[DEBUG] (create_creep): [' + spawn_name + '] Current body: ' +  current_body_cost);
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
    is_millitary: function(creep_obj) {
        let millitary_types = ['attack','ranged_attack','heal','claim'];
        let body_types = _.map(creep_obj.body,'type');
        let millitary_creep = false;
        for(let i in millitary_types)
            if (body_types.indexOf(millitary_types[i]) > 0) {
                millitary_creep = true;
                break;
            }
        return millitary_creep;
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