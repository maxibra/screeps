var global_vars = require('global_vars');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');

// JSON.stringify(obj)

module.exports.loop = function () {
    creep_helpers.clean_memory();
    creep_helpers.create_creep();
    // Create first roads
    if (global_vars.spawn.memory.roads.length == 0) {
        room_helpers.create_road(_.extend(global_vars.spawn.pos, {id: global_vars.spawn.id, structureType: 'spawn'}), _.extend(global_vars.spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'}));  // Spawn-Closest Source
        room_helpers.create_road(_.extend(global_vars.my_room.controller.pos, {id: global_vars.my_room.controller.id, structureType: 'controller'}), _.extend(global_vars.my_room.controller.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'})); // Controller-Closest Source
    }
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