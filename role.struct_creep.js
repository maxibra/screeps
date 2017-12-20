var creep_helpers = require('creep_helpers');
var global_vars = require('global_vars');

var creep_types = {
    'war': {
        'transfer': 0.30,      // max percentage of transfer from total creeps
        'build': 0.60,        // max percentage of builders from total creeps
        'repair_defence': 0.4,          // max percentage of repair units from total creeps
        'repair_civilian': 0.2,          // max percentage of repair units from total creeps
    },
    'peace': {
        'transfer': 0.20,      // max percentage of transfer from total creeps
        'build': 0.30,        // max percentage of builders from total creeps
        'repair_defence': 0.2,          // max percentage of repair units from total creeps
        'repair_civilian': 0.1,          // max percentage of repair units from total creeps
    }
};

var structCreep = {
    run: function(creep, units) {
        // role's definition
        if(creep.carry.energy == 0) {
            if (creep.memory.role != 'harvest') creep.say('harvesting');
            creep.memory.target_id = false;
            creep.memory.role = 'harvest';
        } else if ((creep.memory.role == 'harvest' && creep.carry.energy == creep.carryCapacity) || (creep.memory.role == 'undefined')) {
            var current_workers = units['total'] - units['harvest'];
            var current_creep_types = creep_types[global_vars.spawn.memory.general.status];
            if (global_vars.my_room.memory.target_transfer && (units['transfer']/current_workers < current_creep_types.transfer || units['transfer'] < 1)) {
                creep.say('transfering');
                creep.memory.role = 'transfer';
                creep.memory.target_id = false;
            } else if (global_vars.my_room.memory.target_repair_defence && units['repair_defence']/current_workers < current_creep_types.repair_defence) {
                creep.say('defence repair');
                creep.memory.role = 'repair_defence';
                creep.memory.target_id = false;
            } else if (global_vars.my_room.memory.target_repair_civilian && units['repair_civilian']/current_workers < current_creep_types.repair_civilian) {
                creep.say('civilian repair');
                creep.memory.role = 'repair_civilian';
                creep.memory.target_id = false;
            } else if (global_vars.my_room.memory.targets_build && units['build']/current_workers < current_creep_types.build) {
                creep.say('building');
                creep.memory.role = 'build';
                creep.memory.target_id = false;
            } else {  // Here if no jobs instead upgrading
                creep.say('upgrading');
                creep.memory.role = 'upgrade';
                creep.memory.target_id = false;
            }
        }

        // Action per role
        var creep_role = creep.memory.role;
        switch(creep_role) {
            case 'harvest':
                //TODO: Don't search findClosestByPath each tick
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE));
                if(target) {
                    if (creep.harvest(target) == ERR_NOT_IN_RANGE) creep.moveTo(target, global_vars.moveTo_ops);
                } else creep.memory.role = 'undefined';
                break;
            case 'transfer':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(global_vars.my_room.memory.target_transfer));
                if (target) {
                    var action_res = creep.transfer(target, RESOURCE_ENERGY);
                    switch(action_res) {
                        case OK:
                            creep.memory.role = 'undefined';
                            break;
                        default:
                            creep_helpers.most_creep_action(creep, target, action_res, creep_role);
                    }
                    creep_helpers.most_creep_action(creep, target, creep.transfer(target, RESOURCE_ENERGY));
                } else creep.memory.role = 'undefined';     // All stuctures are full
                break;
            case 'repair_defence':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(global_vars.my_room.memory.target_repair_defence));
                if (target) {
                    creep_helpers.most_creep_action(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'repair_civilian':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(global_vars.my_room.memory.target_repair_civilian));
                if (target) {
                    creep_helpers.most_creep_action(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'build':
                //console.log(creep.name + '-MemBuild: ' + JSON.stringify(global_vars.my_room.memory.targets_build[0].id));
                //var target = creep.pos.findClosestByRange(global_vars.my_room.memory.targets_build);
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(global_vars.my_room.memory.targets_build));
                //console.log(creep.name + '-Build: ' + target.id);
                if (target) {
                    var action_res = creep.build(target);
                    switch(action_res) {
                        case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                            global_vars.my_room.memory.targets_build.shift();
                            creep.memory.role = 'undefined';
                            break;
                        default:
                            creep_helpers.most_creep_action(creep, target, action_res, creep_role);
                    }
                } else creep.memory.role = 'undefined';
                break;
            case 'upgrade':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : creep.room.controller);
                if (target) {
                    creep_helpers.most_creep_action(creep, target, creep.upgradeController(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            default:
                console.log('[ERROR]: No role defined for ' + creep.name + '; ROLE: ' + creep_role);
        }

        {    // HARVEST

            //console.log('Source:' + source);
            //return [source.pos.x, source.pos.y];
        }
    }
};

module.exports = structCreep;
