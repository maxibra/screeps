var global_vars = require('global_vars');
var roleStructCreep = require('role.struct_creep');

var base_body = [WORK,CARRY,MOVE];
var add_body = [WORK,CARRY];
var base_creep = 'harvester';
var spawn = global_vars.spawn;
var nominal_creeps = 9;
var max_creeps = 12;

// Itiliaze spawn memory with creep's metadata
if (typeof spawn.memory.roads == "undefined") spawn.memory.roads = [];
if (typeof spawn.memory.general == "undefined") spawn.memory.general = {gen: 0, index: 0, max: nominal_creeps};
console.log('Creeps general: ' + JSON.stringify(spawn.memory.general));

function body_cost(body) {
    var cost = 0;
    _.forEach(body, function(part) { cost += BODYPART_COST[part]; });
    return cost;
}
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

var creep_helpers = {
    clean_memory: function() {
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }
    },
    create_creep: function() {
        var current_creeps = Game.creeps;
        var creeps_names = Object.keys(current_creeps);
        var harvesters = _.filter(current_creeps, (creep) => creep.memory.role == 'harvester').length;
        // Increase / Decrease desired creeps if exist not completed extensions
        if (global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}}).length > 0) {
            spawn.memory.general.max = max_creeps;
        } else spawn.memory.general.max = nominal_creeps;

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
            spawn.name + '-' + spawn.memory.general.gen + '-' + spawn.memory.general.index + '-' + (current_body_cost/10),
            {role: 'harvester'});
        var mem = {index: (spawn.memory.general.index + 1) % spawn.memory.general.max,
            max: spawn.memory.general.max
        };
        if (mem.index == 0) mem.gen = (spawn.memory.general.gen + 1) % 10;
        else mem.gen = spawn.memory.general.gen;

        spawn.memory.general = mem;
        console.log('Spawning new harvester: ' + newName);
    },
    run: function(units) {
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            var creep_role = creep.memory.role
            roleStructCreep.run(creep, units);
        }
    }
};

module.exports = creep_helpers;