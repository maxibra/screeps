var room_helpers = require('room_helpers');
var global_vars = require('global_vars');

var creep_types = {
    'transfer': 0.20,      // max percentage of transfer from total creeps
    'builder': 0.60        // max percentage of builders from total creeps
};

var transfer_i = 0;
var builder_i = 1;
var upgrader_i = 3;

module.exports = {
    run: function(creep, units) {
        if(creep.carry.energy == 0) {
            if (creep.memory.status != 'harvester') creep.say('harvesting');
            creep.memory.status = 'harvester';
        } else if (creep.memory.status == 'harvester' && creep.carry.energy == creep.carryCapacity) {
            creep.memory.status = 'worker';
        }


        if(creep.memory.status != 'harvester') {
            if (creep.memory.role == 'transfer' && creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
                return;
            }

            // builder possible targets
            var important_structure = global_vars.spawn.memory.important_structures || [];
            var targets = (typeof important_structure == 'undefined' || important_structure.length == 0 ? [] : [important_structure]);
            targets = targets.concat(global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}})[0] || []);
            targets = targets.concat(creep.room.find(FIND_CONSTRUCTION_SITES)[0] || []);

            //console.log('UNITS: ' + (units[builder_i]/creeps_length) + '; LIMIT: ' + creep_types.builder);
            if (creep.memory.role != 'builder' && (units[builder_i]/creeps_length) < creep_types.builder && targets.length > 0) {
                if (creep.memory.role != 'builder') creep.say('building');
                console.log('Create Builder');
                creep.memory.role = 'builder';
            }

            if(creep.memory.role == 'builder' && targets.length > 0) {
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
                return;
            }

            // Here if no jobs instead upgrading
            if (creep.memory.role != 'upgrader') {
                console.log('Create Upgrader');
                creep.say('upgrading');
                creep.memory.role = 'upgrader';
            }
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }

        } else room_helpers.go2best_source(creep);
    },
    define_roles: function(units) {
        var current_creeps = Game.creeps
        var creeps_names = Object.keys(current_creeps);
        var creeps_length = creeps_names.length;

        // possible targets of transfer
        var targets = [];
        //console.log('Creeps: ' + creeps_length + '; Transfers: ' + transferUnits + '; Percentage: ' + transferUnits/creeps_length + '; Definition: ' + creep_types.transfer);
        targets = targets.concat(creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
    }
    })[0] || []);
        if (creep.memory.role != 'transfer' && (units[transfer_i]/creeps_length) < creep_types.transfer && targets.length > 0) {
            if (creep.memory.role != 'transfer') creep.say('transfering');
            creep.memory.role = 'transfer';
        }


    }
};
