var global_vars = require('global_vars');


var creep_body = {
    general: {
        base: [WORK,CARRY,MOVE],
        add: [WORK,CARRY]
    },
    special_carry: {
        base: [CARRY,CARRY,MOVE],
        add: [CARRY,CARRY]
    }
}

var spawn = global_vars.spawn;

function body_cost(body) {
    var cost = 0;
    _.forEach(body, function(part) { cost += BODYPART_COST[part]; });
    return cost;
}
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var creep_helpers = {
    create_creep: function(units) {
        let current_creeps = Game.creeps;
        let creeps_names = Object.keys(current_creeps);
        let creep_memory = {role: 'harvester', target_id: false};
        let creep_name = spawn.name + '-' + spawn.memory.general.index + '-' + spawn.memory.general.gen;
        let current_creep_types = global_vars.creep_types[global_vars.spawn.memory.general.status];
        let name_special = 'gn';
        let current_body = creep_body.general.base;
        let add_body = creep_body.general.add;


        if (creeps_names.length >= spawn.memory.general.max || spawn.spawning) return;

        //console.log('[DEBUG] (create_creep): CREEPS: ' + creeps_names.length);
//        if (spawn.spawning) return;
//        else if (creeps_names.length >= spawn.memory.general.max) {
//            console.log('[INFO] (create_creep): SPECIAL_Units: ' + units['special_carry'] + ' [' + current_creep_types.special_carry + ']');
//            if (units['special_carry']/units['total'] < current_creep_types.special_carry) { // Check creation of special creeps
//                creep_memory.special = 'special_carry';
//                creep_memory.role = 'transfer';
//                name_special = 'sc';
//                current_body = creep_body.special_carry.base;
//                add_body = creep_body.special_carry.add;
//            } else return;
//        }

        let harvesters = _.filter(current_creeps, (creep) => creep.memory.role == 'harvest');
        // console.log('[DEBUG] (creep_helpers): Harvesters: ' + JSON.stringify(harvesters));

        if (harvesters.length == 0 && global_vars.spawn.memory.general.status != 'peace' || creeps_names.length < 3) { // It's no harversters create a minimum body
            // Do nothing
        } else {                      // Create most possible strong body
            let possible_body = current_body.concat(add_body);
            let possible_body_cost = body_cost(possible_body);
            for (i=2;possible_body_cost <= global_vars.my_room.energyCapacityAvailable;i++) {
                current_body = possible_body;
                possible_body = possible_body.concat(add_body);
                if (i%2 == 0) possible_body.push(MOVE);
                possible_body_cost = body_cost(possible_body);
            }
        }

        let current_body_cost = body_cost(current_body);
        if (current_body_cost > global_vars.my_room.energyAvailable) {
            console.log('[INFO] (create_creep): WAITing to create creep: ' + current_body_cost + '/' + global_vars.my_room.energyAvailable)

            // Convert all harvesters with acamulated energy near sources to transfer
            for (let i = 0; i < harvesters.length; i++) {
                //console.log('[DEBUG] (create_creep): H: ' + JSON.stringify(harvesters[i]));
                if (harvesters[i].carry.energy/harvesters[i].carryCapacity > 0.85) {      // convert harvester with 85% energy to transfer
                    Memory.creeps[harvesters[i].name].role = 'transfer';
//                    console.log('[DEBUG] (create_creep): Role of ' + harvesters[i].name + ' (Energy: ' + harvesters[i].carry.energy + ') changed to transfer');
                }
            }
            return;
        }

        creep_name = creep_name + '-' + (current_body_cost/10) + '-' + name_special;

        let exit_code = spawn.spawnCreep(current_body, creep_name, creep_memory);
        if ( exit_code == OK) {
            let new_index = (spawn.memory.general.index + 1) % spawn.memory.general.max;
            spawn.memory.general.index = new_index;
            let new_gen = ((new_index == 0) ? (spawn.memory.general.gen + 1) % 100 : spawn.memory.general.gen);
            spawn.memory.general.gen = new_gen;
            console.log('[INFO] (create_creep): Spawning new harvester: ' + creep_name + '; Body: ' + current_body + '(' + add_body + ')' + '; Mem: ' + JSON.stringify(creep_memory));
        } else console.log('[ERROR] (create_creep): Failed to create creep ' + creep_name + ': ' + exit_code);
    },
    drop_energy2container: function(creep) {

    },
    most_creep_action_results: function(creep, target, action_res, creep_role) {
        switch(action_res) {
            case OK:
                creep.memory.target_id = target.id;
                break;
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, global_vars.moveTo_ops);
                break;
            default:
//                console.log('[WARN] (most_creep_action_results)[' + creep.name + ']: ' + creep_role + ': NO action for result ' + action_res)
                if (creep.memory.role == 'transfer' && creep.memory.target_id != global_vars.spawn.id && global_vars.spawn.energy < global_vars.spawn.energyCapacity) {
                    targets = global_vars.my_room.find(FIND_STRUCTURES, {filter: object => object.energy < object.energyCapacity});
//                    console.log('[DEBUG] (most_creep_action_results)[' + creep.name + ']: ' + 'Target is changed');
                    if (targets[0]) creep.memory.target_id = targets[0].id;
                } else {
                    creep.memory.target_id = false;
                    creep.memory.role = 'undefined';
                }
        }
    }
};

module.exports = creep_helpers;