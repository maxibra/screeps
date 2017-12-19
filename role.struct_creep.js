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
        } else if ((creep.memory.role == 'harvest' && creep.carry.energy == creep.carryCapacity) || (creep.memory.role == 'undefined')) {
            if ((units['transfer']/units['total']) < creep_types.transfer && global_vars.my_room.memory.target_transfer) {
                creep.say('transfering');
                creep.memory.role = 'transfer';
            } else if (creep.memory.role != 'build' && (units['build']/units['total']) < creep_types.build && global_vars.my_room.memory.targets_build) {
                creep.say('building');
                creep.memory.role = 'build';
            } else {  // Here if no jobs instead upgrading
                creep.say('upgrading');
                creep.memory.role = 'upgrade';
            }
        }

        switch(creep.memory.role) {
            case 'harvest':
                //TODO: Don't search findClosestByPath each tick
                var target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if(target) {
                    switch(creep.harvest(target)) {
                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(target, global_vars.moveTo_ops);
                            break;
                    }
                }
                break;
            case 'transfer':
                var target = Game.getObjectById(global_vars.my_room.memory.target_transfer);
                if (target) {
                    let action_res = creep.transfer(target, RESOURCE_ENERGY);
                    switch(action_res) {
                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(target, global_vars.moveTo_ops);
                            break;
                        case ERR_FULL:
                            global_vars.my_room.memory.target_transfer = {};
                            creep.memory.role = 'undefined';
                            break;
                        default:
                            console.log('%c WARN Undefined Transfer out: ' + action_res, 'color: yellow; font-weight: bold;');
                            creep.memory.role = 'undefined';
                    }
                } else creep.memory.role = 'undefined';     // All stuctures are full
                break;
            case 'build':
                //console.log(creep.name + '-MemBuild: ' + JSON.stringify(global_vars.my_room.memory.targets_build[0].id));
                //var target = creep.pos.findClosestByRange(global_vars.my_room.memory.targets_build);
                var target = Game.getObjectById(global_vars.my_room.memory.targets_build);
                //console.log(creep.name + '-Build: ' + target.id);
                if (target) {
                    switch(creep.build(target)) {
                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(target, global_vars.moveTo_ops);
                            break;
                        case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                            global_vars.my_room.memory.targets_build.shift();
                            creep.memory.role = 'undefined';
                            break;
                    }
                } else creep.memory.role = 'undefined';
                break;
            case 'upgrade':
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, global_vars.moveTo_ops);
                }
                break;
            default:
                console.log('ERROR: No role defined for ' + creep.name);
        }

        {    // HARVEST

            //console.log('Source:' + source);
            //return [source.pos.x, source.pos.y];
        }
    }
};

module.exports = structCreep;
