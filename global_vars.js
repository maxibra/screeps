/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('global_vars');
 * mod.thing == 'a thing'; // true
 */
var spawn_name = 'max';
var spawn = Game.spawns[spawn_name];
var my_room = Game.rooms.sim;
var build_priority = ['harvester', 'upgrader', 'builder'];

// Itiliaze spawn memory with creep's metadata
for (i in build_priority) {
    var creep_role = build_priority[i];
    if (typeof spawn.memory.roads == "undefined") spawn.memory.roads = [];
    if (typeof spawn.memory[creep_role] == "undefined") {
        spawn.memory[creep_role] = {gen: 0, index: 0};
        if (creep_role == 'harvester') spawn.memory[creep_role]['transformed2b'] = [];
    }
}

module.exports = {
    spawn_name: spawn_name,
    spawn: spawn,
    my_room: my_room,
    build_priority: build_priority
};