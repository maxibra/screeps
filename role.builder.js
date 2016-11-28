var global_vars = require('global_vars');
var room_helpers = require('room_helpers');

var roleBuilder = {
    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('harvesting');
        }
        if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.say('building');
        }

        if(creep.memory.building) {
            var targets = global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});
            targets = targets.concat(creep.room.find(FIND_CONSTRUCTION_SITES));
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            } else creep.moveTo(global_vars.spawn.pos)  // move from source
        }
        else {
            room_helpers.go2best_source(creep)
        }
    }
};

module.exports = roleBuilder;