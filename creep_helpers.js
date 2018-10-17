var global_vars = Memory.rooms.global_vars;

var creep_body = {
    general: {
        base: [CARRY,CARRY,MOVE],
        add: [CARRY,CARRY,MOVE],
        finalize: [WORK,WORK,MOVE]
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
    },
    build: {
        base: [WORK,CARRY,MOVE],
        add: [WORK,CARRY,MOVE]
    }
}

function body_cost(body) {
    var cost = 0;
    _.forEach(body, function(part) { cost += BODYPART_COST[part]; });
    return cost;
}

function upgrader_body(room_name) {
    let room_level = 1;
    // let room_level = Game.rooms[room_name].controller.level;
    if (room_name === 'E39N49' || room_name === 'E34N47' || room_name === 'E38N47') room_level = 162;
    else if (room_name === 'E37N48') room_level = 1440;
    switch (room_level) {
        case 1: 
            body = [MOVE,WORK,CARRY];  // 2/T
            break;
        case 2: 
            body = [MOVE,WORK,WORK,CARRY];  // 2/T
            break;
        case 8: 
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY];  // 15/T (cost: 2,050)
            break;
        case 1030:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]; // upgrade: 10/T; carry: 300 (cost: 1,550)
            break;
        case 1440:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]; // upgrade = 14/T carry = 400 (cost: 2,200)
            break;
        case 145:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY]; // upgrade = 14/T carry = 50 (cost: 1,800)
            break;
        case 162:   // 400/28T
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY]; // upgrade = 16/T(4.8K/300T) carry = 200 (cost: 2,200 [level:6])
            break;
        case 1715:  // 350/28T
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY]; // upgrade = 17/T(5.1K/300T) carry = 150 (cost: 2,300 [level:6])
            break;
        case 3045:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]; // upgrade: 30/T; carry: 450 (cost: 2,350)
            break;
        default:
            body = [MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY];
    }
    return body;
}

function upgraders_amount(room_name) {
    // Object of rooms with remote targets
    // let upgraders = (Game.rooms[room_name].controller.ticksToDowngrade < 100000) ? 1 : 0;
    let upgraders = 0;
    if (room_name === 'E39N49' || room_name === 'E34N47' || room_name === 'E38N47') upgraders = 1;
    else if (room_name === 'E37N48')  upgraders = 2;
    // switch (room_name) {
    //     case 'E27N41':
    //         upgraders = 2;
    //         break;
    // }
    return upgraders;
}
function remote_target(room_name) {
    // Object of rooms with remote targets
    let target = false;
    switch (room_name) {
        case 'E26N48':  
            target = ['E25N48', 'E25N49', 'E26N47'];
            break;   
        case 'E27N41':  
            target = ['E26N41', 'E26N42', 'E28N41'];
            break;        
        case 'E32N53':  
            target = ['E32N52', 'E31N52', 'E33N54', 'E32N54'];
            break;        
        case 'E27N45':  
            target = ['E27N46', 'E27N44'];
            break;
        case 'E28N48':  
            target = ['E27N48', ]; // 'E27N47']; //, 'E29N48', 'E29N49', 'E28N49'];
            break;
        case 'E32N49':  
            target = ['E31N49', 'E33N49'];
            break;
        case 'E33N47':  
            target = ['E32N47']; //, 'E32N49']; //'E32N48', 'E31N48',  'E33N48'];
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
        case 'E26N47':             
            info_object = {
                homeland_destinations: ['5b936b9a2b516b50267186e1', '5b91c3c550c0524d4dc7add2'],
                amount: 2
            }
            break;        
        case 'E25N48':             
            info_object = {
                homeland_destinations: ['5b91b7ab69a64562799ac8bb', '5b91b2c1501cf2629da0fe55', '5b8b8ebdb81548407f98d8cd'],
                amount: 1
            }
            break;
        case 'E25N49':             
            info_object = {
                homeland_destinations: ['5b91b7ab69a64562799ac8bb', '5b91b2c1501cf2629da0fe55', '5b8b8ebdb81548407f98d8cd'],
                amount: 1
            }
            break;
        case 'E26N42':             
            info_object = {
                homeland_destinations: ['5b7b813e3e1314168cf6872b', '5b7b75f7ff7a3e3d3c3266c7', '5b7b9da33b41006a20d49491'],
                amount: 4
            }
            break;
        case 'E28N41':             
            info_object = {
                homeland_destinations: ['5b7818f69606f140031f82b2', '5b80cc7d127ab96b4f666215', '5b7b9da33b41006a20d49491'],
                amount: 1
            }
            break;
        case 'E26N41':             
            info_object = {
                homeland_destinations: ['5b76fe18049a5b16bc433811',],
                amount: 1
            }
            break;
        case 'E32N54':             
            info_object = {
                homeland_destinations: ['5b61da92a30f486dd74f76a9', '5b67896265965e6dc7b72b82', '5b67071f529e6f26f0cd6244', '5b677e7a617b6e5cdc93a8be'],
                amount: 4
            }
            break;
        case 'E33N54':             
            info_object = {
                homeland_destinations: ['5b61da92a30f486dd74f76a9', '5b67896265965e6dc7b72b82', '5b677e7a617b6e5cdc93a8be', '5b67071f529e6f26f0cd6244'],
                amount: 3
            }
            break;
        case 'E31N52': 
            info_object = {
                homeland_destinations: ['5b613b019007134cd78dc2dd', '5b61401594e55f270224e7c3', '5b6142677b80103f4714004b', '5b61d763b7d44e6423cbb914'],
                amount: 2
            }
            break;
        case 'E32N52': 
            info_object = {
                homeland_destinations: ['5b613b019007134cd78dc2dd', '5b61401594e55f270224e7c3', '5b6142677b80103f4714004b', '5b61d763b7d44e6423cbb914'],
                amount: 3
            }
            break;
        case 'E27N46': 
            info_object = {
                homeland_destinations: ['5b46993b0f4ec249f6ddd878', '5b59dc5b2bde613971b9ba8c'],
                amount: 2
            }
            break;
        case 'E27N44': 
            info_object = {
                homeland_destinations: ['5b46a969e30571430d348744', '5b4e6a9383b2287c458398ca', '5b468a489ddd223460384234', '5b52b31b7c9ee34db2ab8e7b'],
                amount: 3
            }
            break;
        case 'E28N49': 
            info_object = {
                homeland_destinations: ['5b45be9f1e189e61e50b576c',],
                amount: 1
            }
            break;
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
        case 'E32N49':
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5b4ea2b7e792cb16a95750cd'],
                amount: 1
            }
            break;
        case 'E33N48':
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5b4ea2b7e792cb16a95750cd', '5afd5c94f1eabb6ce7a18052'],
                amount: 6
            }
            break;
        case 'E32N47': 
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5b4ea2b7e792cb16a95750cd', '5afd5c94f1eabb6ce7a18052'],
                amount: 1
            }
            break;
        case 'E32N48': 
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5b4ea2b7e792cb16a95750cd', '5afd5c94f1eabb6ce7a18052'],
                amount: 2
            }
            break;
        case 'E31N48': 
            info_object = {
                homeland_destinations: ['5b0152f1ff0838345ccf8ae0', '5b4ea2b7e792cb16a95750cd', '5afd5c94f1eabb6ce7a18052'],
                amount: 5
            }
            break;      
        case 'E31N49': 
            info_object = {
                homeland_destinations: ['5b1a42e409384a778ed5e8f4', '5b153b87c5612c1429ec169b'], // , '5b1f9978e65319287dc4ac89'],
                amount: 1
            }
            break;             
        case 'E33N49': 
            info_object = {
                homeland_destinations: ['5b4387d9a8f9805e72b9a05c', '5b3417a491f5f036a937b8e9', '5b33639acb21c464f0c933a3'], //, '5b1f9978e65319287dc4ac89'],
                amount: 3
            }
            break;   
        case 'E37N49': 
            info_object = {
                homeland_destinations: ['5bc6d6dbb7a49f2a41ed12e9', '5acc524f6bec176d808adb71'],
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

//  Game.spawns['max_E38N48-2'].spawnCreep([MOVE,MOVE,MOVE,CLAIM], 'its_my', {role: 'its_my', claim_room: 'E38N47'})
var creep_helpers = {
    create_creep: function(spawn_name, units) {
        let my_spawn = Game.spawns[spawn_name];
        if (my_spawn.spawning) return;
        
        let room_name = Game.spawns[spawn_name].room.name
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let my_room = Game.rooms[room_name];
        let worker_rooms = {        // {<creator_room>: {<room_of_worker>: <workers_amount>}}
            'E38N48': {
                'E37N48': 0,
                'E38N47': 0,
                'E39N49': 0
            },
            'E33N47': {
                'E34N47': 1
            }
        }
        let create_special = false;

        let current_creeps = Game.creeps;
        let creeps_names = Object.keys(current_creeps);
        let creep_memory = {role: 'harvest', target_id: false, stuck: 0};
        let current_creep_types = room_vars.creep_types[room_vars.status];
        let name_special = 'gn';
        let universal_creeps = units[room_name]['total'] - units[room_name]['sp_total'];
        let current_body = creep_body.general.base;
        let add_body = creep_body.general.add;
        let finalize_body = creep_body.general.finalize;
        let creep_name = '';
        
        // // console.log('[DEBUG] (create_creep)['+ spawn_name + ' basic Body: ' + JSON.stringify(current_body));
        if (my_room.energyAvailable > 400 && 
            (my_room.memory.targets.build.length > 0)) {
            // || my_room.controller.ticksToDowngrade < 140300 
            // || my_room.terminal.store['energy'] < 15000)) {
            // || units[room_name]['energy_miner'] < my_room.memory.energy_flow.sources.length) {
            console.log('[DEBUG] (creep_helpers.create_creep) [' + room_name + '] Get Builder body');
            current_body = creep_body.build.base;
            add_body = creep_body.build.add;
            finalize_body = creep_body.build.finalize;
        }
        // console.log('[DEBUG] (creep_helpers.create_creep) [' + room_name + '] Units ' + JSON.stringify(units));

        if (universal_creeps === 0 && my_room.energyAvailable < 450) {
            // current_body = [MOVE,MOVE,CARRY,CARRY];
            finalize_body = [MOVE, WORK];
        }
        
        let avoid_remote = !(room_name === 'E38N48' || room_name === 'E37N48'); // || room_name === 'E28N48');
        
        let remote_room_in_war = is_remote_room_in_war(room_name)
        // if (room_name === 'E28N48') console.log('(creep_helpers.create_creep) [' + room_name + '] In WAR: ' + remote_room_in_war);

        // !!!! Order of special_creeps is an order of creep's creation. Upper will be created first 
        let special_creeps = {
            attacker_constructions: {
                body:  [MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK],
                memory: {constructions2attack: ['5a4e91517f68e87c650b4ae8', ]},
                name_prefix: 'attacker_const_' + room_name,
                amount: 0,
                avoid: !(room_name === 'E28N48')
            },
            guard: {
                body: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL],
                name_prefix: 'quard_' + room_name,
                memory: {post: [11, 13, 'E37N48']},
                amount: 0,
                avoid: !(room_name === 'E38N48')
            },
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
                amount: upgraders_amount(room_name),
                // avoid: (room_name === 'E26N48')
            },
            remote_energy_miner: {
                // body: [MOVE,MOVE,WORK,WORK,WORK],
                body: [MOVE,MOVE,WORK,WORK,WORK,WORK,WORK],
                memory: {stuck: 0},
                name_prefix: 'rmt_nrg_mnr' + room_name,
                rmt_targets: remote_target(room_name),
                amount: 1,
                // amount: ((Memory.rooms[creep.memory.far_target]) ? Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.source).length : 0),
                // avoid: avoid_remote
                avoid: !(room_name === 'E37N48' || room_name === 'E38N48')
            },
            remote_harvest: {
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // Carry: 750, Harvest: 16/T
                    // ((my_room.energyCapacityAvailable >= 1550) ? [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY] : // Carry: 750
                    //                                     [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]),    // Carry: 600
                // body: [MOVE,WORK,CARRY],
                name_prefix: 'rmt_hrvst_' + room_name,
                rmt_targets: remote_target(room_name),
                avoid: avoid_remote
            // }
            },
            remote_claimer: {
                // Game.getObjectById('5b6ea23987f6041778623097').signController(Game.getObjectById('59f1a4d382100e1594f3d993'), "Stay away from unnecessary conflicts :)")
                body: [MOVE,MOVE,CLAIM,CLAIM],
                name_prefix: 'rmt_claimer_' + room_name,
                amount: 1,
                rmt_targets: remote_target(room_name),
                avoid: avoid_remote ,
                remote_avoid: ['E28N49',]
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
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 1000
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry:1500
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 2K
                name_prefix: 'energy_helper_' + room_name,
                amount: 0,
                avoid: !(room_name === 'E38N48')
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
                amount: 0,
                avoid: (!(my_room.memory.energy_flow.mineral.extractor && Game.getObjectById(my_room.memory.energy_flow.mineral.id).mineralAmount > 0) || 
                        (my_room.storage && (_.sum(_.values(my_room.storage.store)) > (my_room.storage.storeCapacity * 0.9))))
            },
            re_transfer: {
                // body: [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],   // CARRY: 500
                amount: 2,
                avoid: !(room_name === 'E32N53') // || room_name === 'E27N45' || room_name === 'E38N48' || room_name === 'E37N48')   
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
        // console.log('[INFO] (create_creep)[' + room_name + ']: SPECIAL cond: Universal' + universal_creeps + '; Expected: ' + room_vars.screeps_max_amount[room_vars.status]); // >= room_vars.screeps_max_amount[room_vars.status]))

        if (universal_creeps >= room_vars.screeps_max_amount[room_vars.status] &&
            room_vars.status === 'peace') {
            let cur_special_creeps = (units[room_name]['energy_miner'] >= Object.keys(my_room.memory.energy_flow.containers.source).length) ?
                                                special_creeps :
                                                {'energy_miner': special_creeps['energy_miner']};
            // console.log('(create_creep) [' + room_name + '] Energy miners: ' + units[room_name]['energy_miner'] + '; Source containers: ' + Object.keys(my_room.memory.energy_flow.containers.source).length);
            let need2cretae_creep_type = false;
            for (let creep_type in cur_special_creeps) {
                // console.log('(creep_helpers.create_creep) [' + room_name + '] CREEP Type: ' + creep_type);
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
                    continue;
                }
                
                // if (room_name === 'E34N47' ) console.log('(create_creep) [' + room_name + '] Creep type: ' +creep_type);
                const add = (a, b) => a + b;
                if (creep_type === 'energy_miner' && 
                    (Object.keys(my_room.memory.energy_flow.containers.source).map(x => Game.getObjectById(x).store.energy).reduce(add)) > (Object.keys(my_room.memory.energy_flow.containers.source).length * 1000))
                    continue;

                let rmt_targets = (current_obj.rmt_targets) ? current_obj.rmt_targets : [false,];    // false is for moke of intra room special creeps
                let rmt_harvester_obj = false;
                let current_creep_memory = (current_obj.memory) ? current_obj.memory : {};
                // console.log('[INFO] (create_creep)[' + room_name + ']: Remote TARGETS: ' + JSON.stringify(rmt_targets))
                for (let t in rmt_targets) {
                    let remote_room = rmt_targets[t];
                    let creeps_amount;
                    if (creep_type === 'remote_claimer' && current_obj.remote_avoid.indexOf(remote_room) >= 0 ) {
                        continue;
                    } else if (creep_type === 'remote_energy_miner') {
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
                            finalize_body = false;
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

        // Remote workers
        for (let worker_creator_room in worker_rooms) {
            if (room_name === worker_creator_room && Memory.rooms[worker_creator_room].global_vars.status === 'peace' && universal_creeps >= my_room.memory.global_vars.screeps_max_amount.peace) {
                let new_memory = {role: 'worker'};
                for (let worker_room in worker_rooms[worker_creator_room]) {
                    // console.log('[DEBUG] (create_creep.workers): Worker room: ' + worker_room + '; Amount: ' + worker_rooms[worker_creator_room][worker_room]);
                    for (let i=1; i<=worker_rooms[worker_creator_room][worker_room]; i++) {
                        current_new_name = 'worker_' + worker_creator_room + '_' + worker_room + '-' + i;
                        // console.log('[DEBUG] (create_creep): CURRENT NAME: ' + current_new_name)
                        if ( Object.keys(current_creeps).indexOf(current_new_name) === -1) {
                            creep_name = current_new_name;
                            creep_memory = new_memory;
                            // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]; // carry 1000
                            current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]; // carry 800; harvest: 20/T; cost: 2,450
                            // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  // carry: 400
                            // current_body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]
                            // current_body = [MOVE,MOVE,WORK,WORK,CARRY,CARRY];
                            add_body = false;
                            finalize_body = false;
                            break;
                        }
                    }
                }
            }
        }

        // **** LOG
        // console.log('[DEBUG] (create_creep)[' + spawn_name + ']: Creeps: ' +  universal_creeps + '; Must Be: ' + room_vars.screeps_max_amount[room_vars.status] + '; SPAWING: ' + my_spawn.spawning + '; no needed a New: ' + (creep_name === ''));
        // ********

        if (creep_name === '' ) {
            let room_creeps_amount = //(my_room.controller.ticksToDowngrade < 130000) ? room_vars.screeps_max_amount[room_vars.status] * 2 :
                                                                                      room_vars.screeps_max_amount[room_vars.status];
            let possible_name;
            // console.log('[DEBUG] (create_creep): [' + spawn_name + '] creep Amount: ' + room_vars.screeps_max_amount[room_vars.status]);
            for (let i=1; i<=room_creeps_amount; i++) {
                possible_name = room_name + '-' + i + '-' + name_special;
                // console.log('[DEBUG] (create_creep): [' + spawn_name + '] creep name: ' + possible_name);
                if ( Object.keys(current_creeps).indexOf(possible_name) === -1 ) {
                    creep_name = possible_name; 
                }
            }
        }
        if (creep_name === ''    // there is no need to create a creep
            ) return; 
        
        let max_body_cost = ((universal_creeps === 0 || !add_body) && (my_room.energyAvailable < room_vars.max_body_cost)) ? my_room.energyAvailable : room_vars.max_body_cost;
        let possible_body = current_body;
        let possible_body_cost = body_cost(possible_body);
        let body_finalize_cost = (finalize_body) ? body_cost(finalize_body) : 0;
        max_body_cost = max_body_cost - body_finalize_cost;
        // if (room_name === 'E37N48' ) console.log('[DEBUG] (create_creep): [' + spawn_name + '] Universal: ' + universal_creeps + '; Max:' + room_vars.screeps_max_amount[room_vars.status] + '; Add body: ' + add_body + '; Max body cost: ' + max_body_cost + '; Current body:' + current_body)

        for (i=2;possible_body_cost <= Game.rooms[room_name].energyCapacityAvailable;i++) {
            current_body = possible_body;
            // if (room_name === 'E38N48') console.log('[DEBUG] (create_creep): [' + spawn_name + '] ' + i + ' Current body: ' + JSON.stringify(current_body));
            possible_body = possible_body.concat(add_body);
            if (i%2 === 0 && creep_name.substring(0,6) !== room_name) possible_body.push(MOVE);
            possible_body_cost = body_cost(possible_body);
            if (possible_body_cost > max_body_cost || possible_body.length > 50) break;
        }
        
        if (finalize_body) current_body = current_body.concat(finalize_body);
        let current_body_cost = body_cost(current_body);

        
        // if (room_name === 'E32N49' ) console.log('[DEBUG] (create_creep): [' + spawn_name + '] Creep: ' + creep_name +'; body cost: ' +  current_body_cost + '; Body: ' + JSON.stringify(current_body));

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
        let creep_body = creep_obj.body;
        let millitary_body = {};
        for(let b in creep_body) {
            if (millitary_types.indexOf(creep_body[b].type) > 0) {
                millitary_body[creep_body[b].type] = (millitary_body[creep_body[b].type]) ? millitary_body[creep_body[b].type] + creep_body[b].hits : creep_body[b].hits; 
            }
        }
        return (Object.keys(millitary_body).length > 0) ? millitary_body : false;
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
                creep.memory.target_id = target.id;
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