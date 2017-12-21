var global_vars = require('global_vars');

var base_body = [WORK,CARRY,MOVE];
var add_body = [WORK,CARRY];
var spawn = global_vars.spawn;

// Itiliaze spawn memory with creep's metadata
if (typeof spawn.memory.general == "undefined") spawn.memory.general = {gen: 0, index: 0, max: global_vars.creeps_nominal, status: 'peace'};
// console.log('Creeps general: ' + JSON.stringify(spawn.memory.general));

function body_cost(body) {
    var cost = 0;
    _.forEach(body, function(part) { cost += BODYPART_COST[part]; });
    return cost;
}
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var creep_helpers = {
    create_creep: function() {
        var current_creeps = Game.creeps;
        var creeps_names = Object.keys(current_creeps);

        if (creeps_names.length >= spawn.memory.general.max || spawn.spawning) return;

        var harvesters = _.filter(current_creeps, (creep) => creep.memory.role == 'harvest');
        // console.log('[DEBUG] (creep_helpers): Harvesters: ' + JSON.stringify(harvesters));

        var current_body = base_body;
        if (harvesters.length == 0) { // It's no harversters create a minimum body
            current_body = base_body;
        } else {                      // Create most possible strong body
            var possible_body = current_body.concat(add_body);
            var possible_body_cost = body_cost(possible_body);
            for (i=2;possible_body_cost <= global_vars.my_room.energyCapacityAvailable;i++) {
                current_body = possible_body;
                possible_body = possible_body.concat(add_body);
                if (i%2 == 0) possible_body.push(MOVE);
                possible_body_cost = body_cost(possible_body);
            }
        }

        var current_body_cost = body_cost(current_body);
        if (current_body_cost > global_vars.my_room.energyAvailable) {
            console.log('[INFO] (create_creep): SKIP creating creep: ' + current_body_cost + '/' + global_vars.my_room.energyAvailable)
            // harvesters.sort((a,b) => b.carry.energy - a.carry.energy);
            // console.log('[DEBUG] (creep_helpers): LENGTH: ' + harvesters.length + ' Sorted Harvesters: ' + JSON.stringify(harvesters));
            for (var i = 0; i < harvesters.length; i++) {
                //console.log('[DEBUG] (create_creep): H: ' + JSON.stringify(harvesters[i]));
                if (harvesters[i].carry.energy/harvesters[i].carryCapacity > 0.85) {      // convert harvester with 85% energy to transfer
                    Memory.creeps[harvesters[i].name].role = 'transfer';
                    console.log('[DEBUG] (create_creep): Role of ' + harvesters[i].name + ' (Energy: ' + harvesters[i].carry.energy + ') changed to transfer');
                }
            }
            return;
        }

        var creep_name = spawn.name + '-' + spawn.memory.general.index + '-' + spawn.memory.general.gen + '-' + (current_body_cost/10);
        var exit_code = spawn.spawnCreep(current_body, creep_name, {role: 'harvester', target_id: false});
        if ( exit_code == OK) {
            var new_index = (spawn.memory.general.index + 1) % spawn.memory.general.max;
            spawn.memory.general.index = new_index;
            var new_gen = ((new_index == 0) ? (spawn.memory.general.gen + 1) % 100 : spawn.memory.general.gen);
            spawn.memory.general.gen = new_gen;
            console.log('[INFO] (create_creep): Spawning new harvester: ' + creep_name);
        } else console.log('[ERROR] (create_creep): Failed to create creep ' + creep_name + ': ' + exit_code);
    },
    most_creep_action: function(creep, target, action_res, creep_role) {
        switch(action_res) {
            case OK:
                creep.memory.target_id = target.id;
                break;
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, global_vars.moveTo_ops);
                break;
            default:
                console.log('[WARN] ' + creep.name + ': ' + creep_role + ': NO action for result ' + action_res)
                global_vars.my_room.memory.target_transfer = false;
                creep.memory.role = 'undefined';
        }
    }
};

module.exports = creep_helpers;
