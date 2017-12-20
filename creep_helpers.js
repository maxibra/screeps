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
        var harvesters = _.filter(current_creeps, (creep) => creep.memory.role == 'undefined').length;
        // Increase / Decrease desired creeps if exist not completed extensions
//        if (global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}}).length > 0) {
//            spawn.memory.general.max = max_creeps;
//        } else spawn.memory.general.max = nominal_creeps;

        if (creeps_names.length >= spawn.memory.general.max || spawn.spawning ||
            (Game.rooms.sim.energyAvailable < Game.rooms.sim.energyCapacityAvailable && harvesters > 0)) return;    // if no haversters than create any level of it

        // Create most possible strong body
        var current_body = base_body;
        var possible_body = current_body.concat(add_body);
        var possible_body_cost = body_cost(possible_body);
        for (i=2;possible_body_cost <= Game.rooms.sim.energyAvailable;i++) {
            current_body = possible_body;
            possible_body = possible_body.concat(add_body);
            if (i%2 == 0) possible_body.push(MOVE);
            possible_body_cost = body_cost(possible_body);
            //console.log('I = ' + i + '; Current_body: ' + current_body + '; Possible Body: ' + possible_body + '; Possible cost:' + possible_body_cost + '; Energy: ' + Game.rooms.sim.energyAvailable)
        }
        var current_body_cost = body_cost(current_body);
        //console.log('Body: ' + current_body + 'Cost: ' + current_body_cost);
        if (current_body_cost > Game.rooms.sim.energyAvailable) return;

        var newName = spawn.createCreep(current_body,
            spawn.name + '-' + spawn.memory.general.index + '-' + spawn.memory.general.gen + '-' + (current_body_cost/10),
            {role: 'harvester'});

        var new_index = (spawn.memory.general.index + 1) % spawn.memory.general.max;
        spawn.memory.general.index = new_index;
        var new_gen = ((new_index == 0) ? (spawn.memory.general.gen + 1) % 100 : spawn.memory.general.gen);
        spawn.memory.general.gen = new_gen;

        console.log('Spawning new harvester: ' + newName);
    },
    most_creep_action: function(creep, target, action_res, creep_role) {
        switch(action_res) {
            case OK:
                creep.memory.target_id = target.id;
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