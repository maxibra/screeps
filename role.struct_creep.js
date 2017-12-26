var creep_helpers = require('creep_helpers');
//var global_vars = require('global_vars')();

var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Game.rooms[room_name].memory.global_vars;
var my_spawn = Game.spawns[global_vars.spawn_name];
var my_room = Game.rooms[global_vars.room_name];

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
        } else if (creep.ticksToLive < global_vars.age_to_drop_and_die) {    // Drop energy to container before death
            let closest_containers = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_CONTAINER && object.store[RESOURCE_ENERGY] < object.storeCapacity)});
            if (closest_containers) {
                creep.memory.target_id = closest_containers.id;
                creep.memory.role = 'dropper';
            }
            console.log('[DEBUG] (drop_energy2container): Name: ' + creep.name + '; Role: ' + creep.memory.role + '; ticksToLive: ' + creep.ticksToLive + '; Energy: ' + creep.carry[RESOURCE_ENERGY] + '; closest_container: ' + JSON.stringify(closest_containers));
        }else if (condition2change_role) {
            if ((creep.carry.energy/creep.carryCapacity) < 0.2) {   // Too few energy to chnage role go to harvest
                creep.say('transfering');
                creep.memory.target_id = false;
                creep.memory.role = 'harvest';
            }
            var current_workers = units['total'] - units['harvest'];
            var current_creep_types = global_vars.creep_types[my_spawn.memory.general.status];
//            console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer_target: ' + my_room.memory.target_transfer + '; Units: ' + units['transfer'] + '; Workers: ' + current_workers + '(' + (units['transfer']/current_workers) + ' [' + current_creep_types.transfer + ']');
            if (my_room.memory.target_transfer && (units['transfer']/current_workers < current_creep_types.transfer[my_room.controller.level]) || units['transfer'] < 2) {
                creep.say('transfering');
                creep.memory.role = 'transfer';
                //console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                //units.transfer++;
            } else if (my_room.memory.target_repair_defence && units['repair_defence']/current_workers < current_creep_types.repair_defence) {
//                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Changed ' + creep.memory.role + ' to repair_defence: ' + units['repair_defence'] + ' / ' + current_workers + '=' + units['repair_defence']/current_workers + '[' + current_creep_types.repair_defence +']')
                creep.say('defence repair');
                creep.memory.role = 'repair_defence';
                //units.repair_defence++;
            } else if (my_room.memory.target_repair_civilian && units['repair_civilian']/current_workers < current_creep_types.repair_civilian) {
                creep.say('civilian repair');
                creep.memory.role = 'repair_civilian';
                //units.repair_civilian++;
            } else if (my_room.memory.targets_build && units['build']/current_workers < current_creep_types.build) {
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
        let creep_role = creep.memory.role;
        switch(creep_role) {
            case 'harvest':
                //TODO: Don't search findClosestByPath each tick
                if (creep.ticksToLive < global_vars.age_to_drop_and_die) {
                    creep.say('Going2die');
                    creep.suicide();     // Go to die to Cemetery (a far place)
                } else {
//                    var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE));
                    var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : creep.pos.findClosestByRange(FIND_DROPPED_ENERGY));
                    if(target) {
                        if (creep.pickup(target) == ERR_NOT_IN_RANGE) creep.moveTo(target, global_vars.moveTo_ops);
                    } else creep.memory.role = 'undefined';
                }
                break;
            case 'transfer':
                // var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.target_transfer));
                let target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) :
                    { let current target = creep.pos.findClosestByPath(my_room.find(FIND_STRUCTURES,
                            {filter: object => ((object.structureType == STRUCTURE_EXTENSION || object.structureType == STRUCTURE_SPAWN) && object.energy < object.energyCapacity}))};
                      creep.memory.target_id = current_target.id;})};
                if (target) {
                    let act_response = creep.transfer(target, RESOURCE_ENERGY);
                    if (act_response == ERR_FULL && my_room.memory.target_transfer && creep.memory.target_id != my_room.memory.target_transfer) {
                        creep.memory.target_id = my_room.memory.target_transfer;
                    } else creep_helpers.most_creep_action_results(creep, target, creep.transfer(target, RESOURCE_ENERGY), creep_role);
                } else creep.memory.role = 'undefined';     // All stuctures are full
                break;
            case 'repair_defence':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.target_repair_defence));
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'repair_civilian':
                //               var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.target_repair_civilian));
                var target = Game.getObjectById(my_room.memory.target_repair_civilian); // the most targets are roads => stuck on them
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'build':
                //console.log(creep.name + '-MemBuild: ' + JSON.stringify(my_room.memory.targets_build[0].id));
                //var target = creep.pos.findClosestByRange(my_room.memory.targets_build);
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets_build));
                //console.log(creep.name + '-Build: ' + target.id);
                if (target) {
                    var action_res = creep.build(target);
                    switch(action_res) {
                        case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                            my_room.memory.targets_build = false;
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
            case 'dropper':
                let closest_containers = Game.getObjectById(creep.memory.target_id);
                if (creep.pos.getRangeTo(closest_containers) == 0) {
                    creep.drop(RESOURCE_ENERGY);
                } else creep.moveTo(closest_containers, global_vars.moveTo_ops);
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
