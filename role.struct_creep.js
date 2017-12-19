var room_helpers = require('room_helpers');
var global_vars = require('global_vars');

var creep_types = {
    'transfer': 0.20,      // max percentage of transfer from total creeps
    'build': 0.60,        // max percentage of builders from total creeps
    'repair': 0.6,          // max percentage of repair units from total creeps
};

var structCreep = {
    run: function(creep, units) {
        if(creep.carry.energy == 0) {
            if (creep.memory.role != 'harvest') creep.say('harvesting');
            creep.memory.role = 'harvest';
        } else if (creep.memory.role == 'harvest' && creep.carry.energy == creep.carryCapacity) {
            creep.memory.role = 'undefined';
        }

        if(creep.memory.role == 'undefined') {

            if (creep.memory.role != 'transfer' && (units['transfer']/units['total']) < creep_types.transfer) {
                if (creep.memory.role != 'transfer') creep.say('transfering');
                creep.memory.role = 'transfer';
            }
            if (creep.memory.role == 'transfer') {
                // possible targets of transfer
                var targets = [];
                //console.log('Creeps: ' + creeps_length + '; Transfers: ' + transferUnits + '; Percentage: ' + transferUnits/creeps_length + '; Definition: ' + creep_types.transfer);
                targets = targets.concat(creep.room.find(FIND_MY_STRUCTURES, {
                            filter: (structure) => {
                            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
            }
            })[0] || []);
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) creep.moveTo(targets[0], global_vars.moveTo_ops);
                return;
            }

            // builder possible targets
            var important_structure = global_vars.spawn.memory.important_structures || [];
            var targets = (typeof important_structure == 'undefined' || important_structure.length == 0 ? [] : [important_structure]);
            targets = targets.concat(global_vars.my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}})[0] || []);
            targets = targets.concat(creep.room.find(FIND_CONSTRUCTION_SITES)[0] || []);

//            console.log('BUILDER_I: ' + builder_i + '; CREEPS_LENGTH: ' + define_roles.creeps_length);
//            console.log('UNITS: ' + (units['build']/define_roles.creeps_length) + '; LIMIT: ' + creep_types.builder);

            if (creep.memory.role != 'build' && (units['build']/units['total']) < creep_types.build) {
                if (targets.length > 0) {
                    creep.say('building');
                    console.log('Create Builder');
                    creep.memory.role = 'build';
                }
            }

            if(creep.memory.role == 'build' && targets.length > 0) {
                // following length 2 => it's [x,y] of important path from memory else target object
                var build_res = (targets[0].length == 2 ? creep.build(targets[0][0], targets[0][1]) : creep.build(targets[0]));
                //console.log('RES: ' + build_res + 'Target[0]: ' + JSON.stringify(targets[0]));

                switch(build_res) {
                    case ERR_NOT_IN_RANGE:
                        targets[0].length == 2 ? creep.moveTo(targets[0][0], targest[0][1], global_vars.moveTo_ops) : creep.moveTo(targets[0], global_vars.moveTo_ops);
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
            if (creep.memory.role != 'upgrade') {
                console.log('Create Upgrader');
                creep.say('upgrading');
                creep.memory.role = 'upgrade';
            }
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, global_vars.moveTo_ops);
            }

        } else {    // HARVEST
            var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source && (creep.harvest(source) == ERR_NOT_IN_RANGE || creep.harvest(source) == OK)) {
                creep.moveTo(source, global_vars.moveTo_ops);
            }
            //console.log('Source:' + source);
            //return [source.pos.x, source.pos.y];
        }
    }
};

module.exports = structCreep;
