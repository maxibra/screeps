//var global_vars = Memory.rooms.global_vars;

var creep_body = {
    general: {
        base: [WORK,WORK,MOVE],
        add: [CARRY,CARRY,MOVE],
        finalize: [WORK,WORK,MOVE]  // Cost: 250
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
        base: [WORK,WORK,MOVE],
        add: [CARRY,CARRY,MOVE],
        finalize: [WORK,WORK,MOVE]
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
    if (Game.rooms[room_name].controller.level === 6) room_level = 1725;
    else if (Game.rooms[room_name].controller.level === 7) room_level = 2550;
    else if (Game.rooms[room_name].controller.level === 5) room_level = 5;

    switch (room_level) {
        case 1: 
            body = [MOVE,WORK,CARRY];  // 2/T
            break;
        case 2: 
            body = [MOVE,WORK,WORK,CARRY];  // 2/T
            break;
        case 5:     // upgrade = 14/T(4.2K/300T) carry = 200 road=2,3 cost: 1,350 [level:5]
            body = [MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY];
            break;
        case 8:
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY];  // 15/T (cost: 2,050)
            break;
        case 710: // upgrade = 7/T(2.1K/300T) carry = 100 road=2,3 cost: 900 [level:5]
            body = [MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY]
        case 1020: // upgrade = 10/T(3K/300T) carry = 200 road=2,3 cost: 1,800 [level:5]
            body = [MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY]
            break;
        case 1440: // upgrade = 14/T carry = 400 (cost: 2,200)
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
            break;
        case 162:   // upgrade = 16/T(4.8K/300T) carry = 200 (cost: 2,200 [level:6])
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY];
            break;
        case 1725:  // upgrade = 17/T(5.1K/300T) carry = 250 road=2,3 (cost: 2,200 [level:6])
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY];
            break;
        case 1640:   // upgrade = 16/T(4.8K/300T) carry = 400 (cost: 2,400 [level:7])
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
            break;
        case 2040:  // upgrade = 20/T(6K/300T) carry = 400 (cost: 2,600 [level:7])
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
            break;
        case 2550:  // upgrade = 25/T(7.5K/300T) carry = 500 road=2,2 (cost: 3.5K [level:7])
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
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
    if (room_name === 'E38N47' ||
        room_name === 'E39N49' ||
        room_name === 'E29N47' ||
        room_name === 'E36N49') upgraders = 1;
    // else if (room_name === 'E36N49') upgraders = 2;
    return upgraders;
}
function remote_target(room_name) {
    // Object of rooms with remote targets
    let target = false;
    switch (room_name) {
         case 'E27N48':
            target = ['E27N47'];
            break;
        case 'E29N47':
            target = ['E28N47'];
            break;
        // case 'E28N48':
        //     target = ['E27N47']; //, 'E27N48', 'E29N48', 'E29N49', 'E28N49'];
        //     break;
        case 'E33N47':  
            target = ['E32N47']; //, 'E32N49']; //'E32N48', 'E31N48',  'E33N48'];
            break;
        case 'E37N48':
            target = ['E37N49']; //, 'E36N48']; // 'E34N46'];
            break;
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
        case 'E28N47':
            info_object = {
                homeland_destinations: ['5dfe9e60c8186d1f7359e49e', '5dfba7a0a4a113ba61e26341', '5dff0243242a6cc040944a9b'],
                amount: 1
            }
            break;
        case 'E27N47':
            info_object = {
                homeland_destinations: ['5e6a8702d511b66b6376a0c6', '5e6cabc294190b282e698868', '5e6a8cf992122d7258cd9bb6'],
                amount: 1
            }
            break;
        case 'E32N47': 
            info_object = {
                homeland_destinations: ['5bc93291594e063956202344', '5b0152f1ff0838345ccf8ae0', '5afeea7935a4236af6a130d7'],
                amount: 1
            }
            break;
        case 'E37N49': 
            info_object = {
                homeland_destinations: ['5bc6d6dbb7a49f2a41ed12e9', '5be05ab1519c604bf419fcf6', '5acc524f6bec176d808adb71'],
                amount: 1
            }
            break;
        case 'E38N49': 
            info_object = {
                homeland_destinations: ['5ae4db5bcb5e3209ac04979b', '5affb81b83717b6924fc5d49'],
                amount: 1
            }
            break;
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

//  Game.spawns['max-E38N48-2'].spawnCreep([MOVE,MOVE,MOVE,CLAIM], 'its_my', {role: 'its_my', claim_room: 'E38N47'})
var creep_helpers = {
    create_creep: function(spawn_name, units) {
        let my_spawn = Game.spawns[spawn_name];
        if (my_spawn.spawning) return;
        
        let room_name = Game.spawns[spawn_name].room.name
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let my_room = Game.rooms[room_name];
        let worker_rooms = {        // {<creator_room>: {<room_of_worker>: <workers_amount>}}
            'E36N48': {
                'E36N49': 1
            },
            'E38N48': {
                'E37N48': 0,
                'E38N47': 0,
                'E39N49': 0
            },
            'E37N48': {
                'E36N48': 0
            },
            'E33N47': {
                'E34N47': 0
            },
            'E28N48': {
                'E29N47': 0,
                'E27N48': 0
            }
        }
        let create_special = false;

        let current_creeps = Game.creeps;
        let creeps_names = Object.keys(current_creeps);
        let creep_memory = {role: 'harvest', target_id: false, stuck: 0};
        // let current_creep_types = room_vars.creep_types[room_vars.status];
        let name_special = 'gn';
        let universal_creeps = units[room_name]['total'] - units[room_name]['sp_total'];
        let current_body = creep_body.general.base;
        // let add_body = (room_name === 'E29N47') ? [CARRY,WORK,MOVE] : creep_body.general.add;
        // let finalize_body = (room_name === 'E29N47') ? [WORK,WORK,MOVE] : creep_body.general.finalize;
        let add_body = creep_body.general.add;
        let finalize_body = creep_body.general.finalize;
        let creep_name = '';

        // console.log('[DEBUG] (create_creep)['+ spawn_name + ' basic Body: ' + JSON.stringify(current_body));
        if (my_room.energyAvailable > 800 &&
            my_room.memory.targets.build.length > 0) {
            // || my_room.controller.ticksToDowngrade < 140300 
            // || my_room.terminal.store['energy'] < 15000)) {
            // || units[room_name]['energy_miner'] < my_room.memory.energy_flow.sources.length) {
            // console.log('[DEBUG] (creep_helpers.create_creep) [' + room_name + '] Get Builder body');
            current_body = creep_body.build.base;
            add_body = creep_body.build.add;
            finalize_body = creep_body.build.finalize;
        }
        // console.log('[DEBUG] (creep_helpers.create_creep) [' + room_name + '] Units ' + JSON.stringify(units));

        if (universal_creeps === 0 && my_room.energyAvailable < 450) {
            // current_body = [MOVE,MOVE,CARRY,CARRY];
            finalize_body = [MOVE, WORK];
        }
        
        let avoid_remote = !(room_name === 'E38N48' || 
                             room_name === 'E37N48' || 
                             room_name === 'E33N47' ||
                             room_name === 'E29N47' ||
                             room_name === 'E27N48');
        
        let remote_room_in_war = is_remote_room_in_war(room_name)
        // if (room_name === 'E28N48') console.log('(creep_helpers.create_creep) [' + room_name + '] In WAR: ' + remote_room_in_war);

        // !!!! Order of special_creeps is an order of creep's creation. Upper will be created first 
        let special_creeps = {
            attacker_constructions: {
                // body:  [MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], # # move plain=2, attack=180/T
                body: [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], // move plain=1, attack=180/T
                memory: {constructions2attack: ['5b0781b4907d7b6fdbb953ec', '5b07703655d24e5c1fb56566', '5b07f346cba50b6fa48bde0e', '5b0756106d41df6fee7945ff',
                                                '5ada3b205918a62fa524502a', '5aeb8dc24390a242a4bf1726', '5ada3a82221f114b7f0fd424', '5b0805eb907d7b6fdbb98d14',
                                                '5b0737950131b30148263118', '5b076bd78ca64d2ce352c78a', '5b075140692a936fdc98d6d9', '5ada3a82221f114b7f0fd424',
                                                '5b07b7275c32205bf2d01712', '5ada34f0b8f8db5203edcae1', '5ada332323774a6d4aa63b0f', '5ada33cbc0037f40373e7b4e',
                                                '5ac39572ce03634b9a5bbf47', '5accb4920deb0d30a3128f27', '5b1f22c282fb82056e1910e0', '5b1faffde65319287dc4b4a3', 
                                                '5b078bc7187fe614ff0d08db', '5ac32cf9f36c474bccc1f964', '5b081aa5f9e1a866b61d67d9', '5b07fe3549d5240153fe32f3',
                                                '5aefd17f59326e11abaa2a71']},
                name_prefix: 'attacker_const_' + room_name,
                amount: 0,
                avoid: !(room_name === 'E36N48')
            },
            guard: {
                body: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL],
                name_prefix: 'quard_' + room_name,
                memory: {post: [11, 13, 'E37N48']},
                amount: 0,
                avoid: !(room_name === 'E38N48')
            },
            attacker: {
                // body:  [MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,HEAL], // COST: 820
                body: [TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL], // COST:1.660K
                memory: {room_in_war: remote_room_in_war},
                name_prefix: 'attacker_' + room_name,
                amount: 2,
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
                body: [MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK], // Cost: 350; harvest: 10/T; plain=2,2; road=1,1 
                memory: {stuck: 0},
                name_prefix: 'rmt_nrg_mnr' + room_name,
                rmt_targets: remote_target(room_name),
                avoid: !(room_name === 'E38N48' || room_name === 'E37N48' ||
                         room_name === 'E29N47'|| room_name === 'E33N47' || room_name === 'E27N48')
            },
            remote_harvest: {
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // Carry: 800, Harvest: 6/T; Build: 15/T; Cost: 1,600
                    // [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // Carry: 750, Harvest: 16/T; Cost: 2,150
                    // [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // Carry: 1500, Harvest: 6/T; Cost: 2.650K
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
                body: [MOVE,MOVE,CLAIM,CLAIM],  // Cost: 1,300
                name_prefix: 'rmt_claimer_' + room_name,
                amount: 1,
                rmt_targets: remote_target(room_name),
                avoid: avoid_remote,
                remote_avoid: ['E27N49']
            },
            lab_assistent: {
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 800
                body: [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY], // carry: 200
                // body: [MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 400
                amount: 1,
                avoid: (Game.cpu.bucket < 9000 || !my_room.memory.global_vars.screeps_max_amount.lab_assistent_needed)
            },   
            energy_helper: {
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 500
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry: 1000
                // body: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], // carry:1500
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
                avoid: ((my_room.storage && ((my_room.memory.energy_flow.store_used.storage > (my_room.storage.store.getCapacity() * 0.93)) ||
                                             (my_room.storage.store[my_room.memory.energy_flow.mineral.type] < (950000-Memory.rooms.global_vars.storage_emergency_ration)))) ||
                        !(my_room.memory.energy_flow.mineral.extractor && Game.getObjectById(my_room.memory.energy_flow.mineral.id).mineralAmount > 0))
                        // (my_room.terminal && (my_room.terminal.store[my_room.memory.energy_flow.mineral.type] > 50000))))
            },
            re_transfer: {
                // body: [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
                body: [MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],   // CARRY: 500
                amount: 0,
                avoid: !(room_name === 'E39N49') // || room_name === 'E27N45' || room_name === 'E38N48' || room_name === 'E37N48')
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
            let cur_special_creeps = (my_room.controller.level >= 3 && units[room_name]['energy_miner'] < Object.keys(my_room.memory.energy_flow.containers.source).length) ?
                                                {'energy_miner': special_creeps['energy_miner']} :
                                                special_creeps;
            // console.log('(create_creep) [' + room_name + '] Energy miners: ' + units[room_name]['energy_miner'] + '; Source containers: ' + Object.keys(my_room.memory.energy_flow.containers.source).length);
            let need2cretae_creep_type = false;
            for (let creep_type in cur_special_creeps) {
                // if (room_name === 'E27N48') console.log('(creep_helpers.create_creep) [' + room_name + '] CREEP Type: ' + creep_type);
                current_obj = cur_special_creeps[creep_type];
                current_name_prefix = (current_obj.name_prefix) ? current_obj.name_prefix : (creep_type + '_' + room_name);

                // Check condition to avoid the current type
                if (current_obj.avoid || current_obj.amount === 0) {
                    // if (room_name === 'E27N48') console.log('(create_creep) [' + room_name + '] Avoid unit ' + creep_type + '; Avoid condition: ' + current_obj.avoid + '; Expected amount: ' + current_obj.amount);
                    continue;
                }
                let cur_remote_target = remote_target(room_name); 

                // for (let d in cur_remote_target)
                //     console.log('(create_creep)[' + cur_remote_target[d] + '] Memory: ' + JSON.stringify(Memory.rooms[cur_remote_target[d]]));

                // if ((creep_type === 'remote_harvest' || creep_type === 'remote_claimer' || creep_type === 'remote_energy_miner') && cur_remote_target && (cur_remote_target.map(x => (Memory.rooms[x] && Memory.rooms[x].global_vars && Memory.rooms[x].global_vars.status)).indexOf('war') > -1)) {
                //     console.log('(create_creep) [' + room_name + '] Remote rooms in WAR. Stop creating of remote_harvester and remote_claimer in the room: ' + cur_remote_target.map(x => Memory.rooms[x].global_vars.status));
                //     continue;
                // }
                
                // console.log('(create_creep) [' + room_name + '] Creep type: ' +creep_type);
                const add = (a, b) => a + b;
                // console.log('[DEBUG] (create_creep) [' + room_name + '] CONTAINERS: ' + JSON.stringify(my_room.memory.energy_flow.containers))
                // console.log('[DEBUG] (create_creep) [' + room_name + '] SOURCE CONTAINERS: ' + JSON.stringify(Object.keys(my_room.memory.energy_flow.containers.source)))
                if (creep_type === 'energy_miner' && !my_room.memory.energy_flow.containers.miner_is_needed)
                    continue;

                let rmt_targets = (current_obj.rmt_targets) ? current_obj.rmt_targets : [false,];    // false is for moke of intra room special creeps
                let rmt_harvester_obj = false;
                let current_creep_memory = (current_obj.memory) ? current_obj.memory : {};
                // console.log('[INFO] (create_creep)[' + room_name + ']: Remote TARGETS: ' + JSON.stringify(rmt_targets))
                for (let t in rmt_targets) {
                    let remote_room = rmt_targets[t];
                    let creeps_amount;
                    if (creep_type === 'remote_claimer' && current_obj.remote_avoid.indexOf(remote_room) >= 0 ) {
                        console.log('[DEBUG] (create_creep.claimer): Remote avoid room ' +  remote_room)
                        continue;
                    } else if (creep_type === 'remote_energy_miner') {
                        // creeps_amount = 0
                        // creeps_amount = 1
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
                        if (remote_room && creep_type === 'remote_claimer' && ((Memory.rooms[remote_room] && Memory.rooms[remote_room].endReservation - Game.time) > 4400)) {
                            console.log('(create_creep)[' + room_name + '][' + remote_room + '] Controller reservation longer than 4400. skipped');
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
                let new_memory = {
                    role: 'worker',
                    "target_id": false,
                    "harvester_type": false,
                    "stuck": 0,
                    "has_minerals": false
                };
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
        // if (room_name === 'E27N48') console.log('(create_creep) [' + room_name + '] creep name: ' + creep_name);

        if (creep_name === '' && (room_vars.status === 'war' || room_vars.room_min_ticksToLive < 1450)) {  // Difference to the youngest creep in about 200 ticks
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
        if (creep_name === '' ) return;   // there is no need to create a creep
             
        
        let max_body_cost = ((universal_creeps === 0 || !add_body) && (my_room.energyAvailable < room_vars.max_body_cost)) ? my_room.energyAvailable : room_vars.max_body_cost;
        let possible_body = current_body;
        let possible_body_cost = body_cost(possible_body);
        let body_finalize_cost = (finalize_body) ? body_cost(finalize_body) : 0;
        max_body_cost = max_body_cost - body_finalize_cost;
        if (room_name === 'E27N48' ) console.log('[DEBUG] (create_creep): [' + spawn_name + '] Universal: ' + universal_creeps + '; Max:' + room_vars.screeps_max_amount[room_vars.status] + '; Add body: ' + add_body + '; Max body cost: ' + max_body_cost + '; Current body:' + current_body)

        for (i=2;possible_body_cost <= Game.rooms[room_name].energyCapacityAvailable;i++) {
            current_body = possible_body;
            // if (room_name === 'E38N48') console.log('[DEBUG] (create_creep): [' + spawn_name + '] ' + i + ' Current body: ' + JSON.stringify(current_body));
            possible_body = possible_body.concat(add_body);
            if (i%2 === 0 && creep_name.substring(0,6) !== room_name) possible_body.push(MOVE);
            possible_body_cost = body_cost(possible_body) + 250;    // 250 is cost of finalize
            if (possible_body_cost > max_body_cost || possible_body.length > 50 ||
                possible_body_cost > Game.rooms[room_name].energyCapacityAvailable) break;
        }
        
        if (finalize_body) current_body = current_body.concat(finalize_body);
        let current_body_cost = body_cost(current_body);

        // if (room_name === 'E32N49' ) console.log('[DEBUG] (create_creep): [' + spawn_name + '] Creep: ' + creep_name +'; body cost: ' +  current_body_cost + '; Body: ' + JSON.stringify(current_body));

        if (current_body_cost > Game.rooms[room_name].energyAvailable) {
            console.log('[DEBUG] (create_creep): [' + spawn_name + '] WAITing to create creep ' + creep_name + ': ' +  Game.rooms[room_name].energyAvailable + '/' + current_body_cost);
            return;
        }

        // if (creep_name.includes('-gn')) {
        //     let carru_parts = current_body.filter(i => i === CARRY).length
        //     creep_memory['carry_capacity'] = carru_parts * CARRY_CAPACITY
        // }

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
            //closest_containers = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_CONTAINER && object.store[RESOURCE_ENERGY] < object.getCapacity())});

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
                creep.moveTo(target, Memory.rooms.global_vars.moveTo_ops);
                creep.memory.target_id = target.id;
                break;
            case ERR_FULL:
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
                creep.memory.role = 'undefined';
                if (my_room.memory.towers.current[target.id] === creep.id) my_room.memory.towers.current[target.id] = false;
            default:
//                console.log('[WARN] (most_creep_action_results)[' + creep.name + ']: ' + creep_role + ': NO action for result ' + action_res)
//                 if (creep.memory.role == 'transfer' && creep.memory.target_id != my_spawn.id && my_spawn.store[RESOURCE_ENERGY] < my_spawn.store.getCapacity(RESOURCE_ENERGY)) {
//                     targets = my_room.find(FIND_STRUCTURES, {filter: object => object.store[RESOURCE_ENERGY] < object.store.getCapacity(RESOURCE_ENERGY)});
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