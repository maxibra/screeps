var global_vars = require('global_vars');
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

var base_body = [WORK,CARRY,MOVE];
var add_body = [WORK,CARRY];
var base_creep = 'harvester';
var spawn = global_vars.spawn;
var max_creeps = 0;
var creep_types = {
    'harvester': {func: roleHarvester, max: 6, min: 2},
    'upgrader': {func: roleUpgrader, max: 6 ,min: 2},
    'builder': {func: roleBuilder, max: 6, min: 2}
};

// Itiliaze spawn memory with creep's metadata
for (i in global_vars.build_priority) {
    var creep_role = global_vars.build_priority[i];
    if (typeof spawn.memory.roads == "undefined") spawn.memory.roads = [];
    if (typeof spawn.memory[creep_role] == "undefined") {
        console.log('ROle: ' + creep_role + 'Min: ' + creep_types[creep_role]['min'])
        spawn.memory[creep_role] = {gen: 0, index: 0, desired: creep_types[creep_role]['min']};
        if (creep_role == 'harvester') spawn.memory[creep_role]['transformed2b'] = [];
    }
}

for (var creep_role in creep_types) max_creeps += spawn.memory[creep_role]['desired'];
console.log('Max Creeps: ' + max_creeps);

function body_cost(body) {
    var bodyCost = {
        "move": 50,
        "work": 100,
        "carry": 50,
        "attack": 80,
        "ranged_attack": 150,
        "heal": 250,
        "claim": 600,
        "tough": 10
    };
    var cost = 0;
    _.forEach(body, function(part) { cost += bodyCost[part]; });
    return cost;
}
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var creep_helpers = {
    clean_memory: function() {
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
                var transformed_array = global_vars.spawn.memory.harvester.transformed2b;
                var name_index = transformed_array.indexOf(name);
                if (name_index > -1) {
                    transformed_array.splice(name_index, 1);
                    global_vars.spawn.memory.harvester.transformed2b = transformed_array;
                    console.log('Remove from transformed memory:', name);
                }
            }
        }
    },
    create_creep: function() {
        var current_creeps = Game.creeps;
        var creeps_names = Object.keys(current_creeps);
        var harvesters = _.filter(current_creeps, (creep) => creep.memory.role == 'harvester').length;
        if (creeps_names.length >= max_creeps || spawn.spawning ||
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

        for (var creep_role_index in global_vars.build_priority) {
            var creep_role = global_vars.build_priority[creep_role_index];
            if (creep_role == 'harvester' && spawn.memory['harvester']['transformed2b'].length > 0) continue;   // Exist transformed harvesters
            var creeps_of_role = _.filter(current_creeps, (creep) => creep.memory.role == creep_role);
            var role_length = creeps_of_role.length
            if ( role_length < spawn.memory[creep_role]['desired'] && !spawn.canCreateCreep(current_body)) {
                var newName = spawn.createCreep(current_body, creep_role[0]+'-'+spawn.name+spawn.memory[creep_role]['gen']+spawn.memory[creep_role]['index'] + '-' + (current_body_cost/10), {role: creep_role});
                spawn.memory[creep_role]['index'] = (spawn.memory[creep_role]['index'] + 1) % spawn.memory[creep_role]['desired'];
                if (spawn.memory[creep_role]['index'] == 0) {
                    spawn.memory[creep_role]['gen'] = (spawn.memory[creep_role]['gen'] + 1) % 10;
                }
                console.log('Spawning new harvester: ' + newName);
                break;
            }
            // else {
            //     console.log('Cant create ' + creep_role + ': ' + creeps_of_role.length + ' / ' + max_creeps + '; Energy:' + Game.spawns[spawn_name].energy + ' / ' + creep_helpers.body_cost(base_body))
            // }
        }
    },
    run: function() {
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            var creep_role = creep.memory.role
            creep_types[creep_role]['func'].run(creep);
        }
    }
};

module.exports = creep_helpers;