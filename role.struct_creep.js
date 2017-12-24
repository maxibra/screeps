var creep_helpers = require('creep_helpers');
var global_vars = require('global_vars');

var structCreep = {
    run: function(creep, units) {
        // role's definition
        let iam_general = (typeof creep.memory.special == "undefined");
        var condition2change_role = (iam_general && ((creep.memory.role == 'harvest' && creep.carry.energy == creep.carryCapacity) ||
        (creep.memory.role == 'undefined')));
        if(creep.carry.energy == 0) {
            if (creep.memory.role != 'harvest') creep.say('harvesting');
            creep.memory.target_id = false;
            if (iam_general) creep.memory.role = 'harvest';   // change role if the creep isn't from special role
        } else if (condition2change_role) {
            if ((creep.carry.energy/creep.carryCapacity) < 0.2) {   // Too few energy to chnage role go to harvest
                creep.say('transfering');
                creep.memory.target_id = false;
                creep.memory.role = 'harvest';
            }
            var current_workers = units['total'] - units['harvest'];
            var current_creep_types = global_vars.creep_types[global_vars.spawn.memory.general.status];
//            console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer_target: ' + global_vars.my_room.memory.target_transfer + '; Units: ' + units['transfer'] + '; Workers: ' + current_workers + '(' + (units['transfer']/current_workers) + ' [' + current_creep_types.transfer + ']');
            if (global_vars.my_room.memory.target_transfer && (units['transfer']/current_workers < current_creep_types.transfer) || units['transfer'] < 1) {
                creep.say('transfering');
                creep.memory.role = 'transfer';
                //console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                //units.transfer++;
            } else if (global_vars.my_room.memory.target_repair_defence && units['repair_defence']/current_workers < current_creep_types.repair_defence) {
//                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Changed ' + creep.memory.role + ' to repair_defence: ' + units['repair_defence'] + ' / ' + current_workers + '=' + units['repair_defence']/current_workers + '[' + current_creep_types.repair_defence +']')
                creep.say('defence repair');
                creep.memory.role = 'repair_defence';
                //units.repair_defence++;
            } else if (global_vars.my_room.memory.target_repair_civilian && units['repair_civilian']/current_workers < current_creep_types.repair_civilian) {
                creep.say('civilian repair');
                creep.memory.role = 'repair_civilian';
                //units.repair_civilian++;
            } else if (global_vars.my_room.memory.targets_build && units['build']/current_workers < current_creep_types.build) {
                creep.say('building');
                creep.memory.role = 'build';
                units.build++;
            } else {  // Here if no jobs instead upgrading
                creep.say('upgrading');
                creep.memory.role = 'upgrade';
                //units.upgrade++;
            }
            creep.memory.target_id = false;
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
                    var act_response = creep.transfer(target, RESOURCE_ENERGY);
                    if (act_response == ERR_FULL && global_vars.my_room.memory.target_transfer && creep.memory.target_id != global_vars.my_room.memory.target_transfer) {
                        creep.memory.target_id = global_vars.my_room.memory.target_transfer;
                    } else creep_helpers.most_creep_action_results(creep, target, creep.transfer(target, RESOURCE_ENERGY), creep_role);
                } else creep.memory.role = 'undefined';     // All stuctures are full
                break;
            case 'repair_defence':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(global_vars.my_room.memory.target_repair_defence));
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'repair_civilian':
                //               var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(global_vars.my_room.memory.target_repair_civilian));
                var target = Game.getObjectById(global_vars.my_room.memory.target_repair_civilian); // the most targets are roads => stuck on them
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
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
                            global_vars.my_room.memory.targets_build = false;
                            creep.memory.role = 'undefined';
                            break;
                        default:
                            creep_helpers.most_creep_action_results(creep, target, action_res, creep_role);
                    }
                } else creep.memory.role = 'undefined';
                break;
            case 'upgrade':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : creep.room.controller);
                if (target) {
                    creep_helpers.most_creep_action_results(creep, target, creep.upgradeController(target), creep_role);
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
