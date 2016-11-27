var global_vars = require('global_vars');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');

module.exports.loop = function () {
    creep_helpers.clean_memory();
    creep_helpers.create_creep();
    room_helpers.create_road(global_vars.spawn.memory.create_roads.shift());
    // Check exist not full extensions
    var extensions = Game.rooms.sim.find(FIND_MY_STRUCTURES, {   filter: { structureType: STRUCTURE_EXTENSION } });
    var extensions_energy = 0;
    for (i in extensions) {
        extensions_energy += (extensions[i].energyCapacity - extensions[i].energy)
    }

    // transfer the role of harversters back if possible
    if (global_vars.spawn.energy < 300 || extensions_energy > 0) {
        var transformed_list = global_vars.spawn.memory['harvester']['transformed2b'];
        if (transformed_list.length > 0) {
            Game.creeps[transformed_list.shift()].memory.role = 'harvester';
            global_vars.spawn.memory['harvester']['transformed2b'] = transformed_list;
        }

    }
    creep_helpers.run()
}