var global_vars = Memory.rooms.global_vars;

var creep_body = {
    general: {
        base: [WORK,CARRY,MOVE],
        add: [WORK,CARRY]
    },
    special_carry: {
        base: [CARRY,CARRY,MOVE],
        add: [CARRY,CARRY]
    },
    special_upgrade: {
        base: [WORK,WORK,MOVE],
        add: [WORK,CARRY]
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
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var creep_helpers = {
    create_creep: function(spawn_name, units) {
        let my_spawn = Game.spawns[spawn_name];
        let room_name = Game.spawns[spawn_name].room.name
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let my_room = Game.rooms[room_name];
        let new_room_creeps = 7;

        let current_creeps = Game.creeps;
        let creeps_names = Object.keys(current_creeps);
        let creep_memory = {role: 'harvester', target_id: false, stuck: 0};
        let current_creep_types = room_vars.creep_types[room_vars.status];
        let name_special = 'gn';
        let current_body = creep_body.general.base;
        let add_body = creep_body.general.add;

        creep_name = '';
        if (room_name !== 'E38N48') {
            let new_memory = {role: 'harvest', harvester_type: 'source', target_id: '59f1a59182100e1594f3eb89', stuck: 0};
            for (let i=1; i<=new_room_creeps; i++) {
                current_new_name = 'max_new-' + i;
                // console.log('[DEBUG] (create_creep): CURRENT NAME: ' + current_new_name)
                if ( Object.keys(Game.creeps).indexOf(current_new_name) === -1 ) {
                    creep_name = current_new_name;
                    creep_memory = new_memory;
                    break;
                }
            }
        }

        // **** LOG
        // console.log('[DEBUG] (create_creep)[' + spawn_name + ']: Creeps: ' +  units[room_name].total + '; Must Be: ' + room_vars.screeps_max_amount[room_vars.status] + '; SPAWING: ' + my_spawn.spawning + '; no needed a New: ' + (creep_name === ''));
        // ********

        if ((creep_name === '' && (units[room_name].total >= room_vars.screeps_max_amount[room_vars.status])) || my_spawn.spawning) return;

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

        let harvesters = _.filter(current_creeps, (creep) => creep.memory.role == 'harvest');
        // console.log('[DEBUG] (creep_helpers)[:' + spawn_name + '] Harvesters: ' + JSON.stringify(harvesters));

        if (units[room_name].total < 2 || !add_body) {// == 0 && my_spawn.memory.general.status != 'peace'){// || creeps_names.length < 3) { // It's no harversters create a minimum body
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
        // console.log('[DEBUG] (create_creep): HARVESTERS: ' +  harvesters.length + '; CREEPS: ' + creeps_names.length + '; BODY COST: ' + current_body_cost + '; BODY: ' + current_body);
//        if (current_body_cost > my_room.energyAvailable) {

        if (creep_name === '' ) creep_name = room_name + '-' + my_spawn.memory.general.index + '-' + my_spawn.memory.general.gen + '-' + (current_body_cost/10) + '-' + name_special;

        if (current_body_cost > Game.rooms[room_name].energyAvailable) {
            console.log('[DEBUG] (create_creep): [' + spawn_name + '] WAITing to create creep ' + creep_name + ': ' + current_body_cost + '/' + Game.rooms[room_name].energyAvailable + "(" + my_room.energyAvailable + ")");

            // Convert all harvesters with acamulated energy near sources to transfer
            // for (let i = 0; i < harvesters.length; i++) {
            //     //console.log('[DEBUG] (create_creep): H: ' + JSON.stringify(harvesters[i]));
            //     if (harvesters[i].carry.energy/harvesters[i].carryCapacity > 0.85) {      // convert harvester with 85% energy to transfer
            //         Memory.creeps[harvesters[i].name].role = 'transfer';
            //         // console.log('[DEBUG] (create_creep): Role of ' + harvesters[i].name + ' (Energy: ' + harvesters[i].carry.energy + ') changed to transfer');
            //     }
            // }
            return;
        }

        let exit_code = Game.spawns[spawn_name].spawnCreep(current_body, creep_name, creep_memory);
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
                break;
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, global_vars.moveTo_ops);
                break;
            case ERR_FULL:
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
                creep.memory.role = 'undefined';
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