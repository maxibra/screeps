var room_helpers = require('room_helpers');
var global_vars = require('global_vars');

function go2carryEnergy(creep) {
    var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
}   // find an empty from enregy structures
});
    if(targets.length > 0) {
        if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0]);
        }
    } else {
        // No Target => Change role to builder
        var transformed_list = global_vars.spawn.memory['harvester']['transformed2b']
        transformed_list.push(creep.name)
        global_vars.spawn.memory['harvester']['transformed2b'] = transformed_list
        creep.memory.role = 'builder'
    }
}

var roleHarvester = {
    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.carry.energy < creep.carryCapacity) {
            room_helpers.go2best_source(creep);
        }
        else go2carryEnergy(creep);
    }
};

module.exports = roleHarvester;