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
            // Extensions have a higher priority
            var important_structure = global_vars.spawn.memory.important_structures || [];
            var targets = (typeof important_structure == 'undefined' || important_structure.length == 0 ? [] : [important_structure]);
            targets = targets.concat(global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}})[0] || []);
            targets = targets.concat(creep.room.find(FIND_CONSTRUCTION_SITES)[0] || []);
            //console.log('Targets: ' + JSON.stringify(targets) + 'Imporatnt: ' + JSON.stringify(important_structure));
            if(targets.length) {
                // following length 2 => it's [x,y] of important path from memory else target object
                var build_res = (targets[0].length == 2 ? creep.build(targets[0][0], targets[0][1]) : creep.build(targets[0]));
                //console.log('RES: ' + build_res + 'Target[0]: ' + JSON.stringify(targets[0]));

                switch(build_res) {
                    case ERR_NOT_IN_RANGE:
                        targets[0].length == 2 ? creep.moveTo(targets[0][0], targest[0][1]) : creep.moveTo(targets[0]);
                        break;
                    case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                        important_structure.shift();
                        //console.log('Imporatnt: ' + JSON.stringify(important_structure));
                        global_vars.spawn.memory.important_structures = important_structure;
                        break;
                }
            } else creep.moveTo(global_vars.spawn.pos)  // move from source
        }
        else {
            room_helpers.go2best_source(creep)
        }
    }
};

module.exports = roleBuilder;