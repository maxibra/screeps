var creep_helpers = require('creep_helpers');
var role_harvester = require('role.harvester');
var role_miner = require('role.miner');
//var global_vars = require('global_vars')();

var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Game.rooms[room_name].memory.global_vars;
var my_spawn = Game.spawns[global_vars.spawn_name];
var my_room = Game.rooms[global_vars.room_name];

var structCreep = {
    run: function(creep, units) {
        // role's definition
        let iam_general = (typeof creep.memory.special === "undefined");
        var condition2change_role = (iam_general && ((creep.memory.role === 'harvest' && creep.carry.energy == creep.carryCapacity) ||
            creep.memory.role === 'undefined'));
//        console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        var targets;
        if(creep.carry.energy === 0 || creep.memory.role === 'harvest') role_harvester.run(creep, iam_general);
        else if (creep.ticksToLive < global_vars.age_to_drop_and_die) {    // Drop energy to container before death
            let closest_containers = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_CONTAINER && object.store[RESOURCE_ENERGY] < object.storeCapacity)});
            if (closest_containers) {
                creep.memory.target_id = closest_containers.id;
                creep.memory.role = 'dropper';
            }
            console.log('[DEBUG] (drop_energy2container): Name: ' + creep.name + '; Role: ' + creep.memory.role + '; ticksToLive: ' + creep.ticksToLive + '; Energy: ' + creep.carry[RESOURCE_ENERGY] + '; closest_container: ' + JSON.stringify(closest_containers));
        } else if (condition2change_role) {
            // if ((creep.carry.energy/creep.carryCapacity) < 0.2) {   // Too few energy to chnage role go to harvest
            //     creep.say('transfering');
            //     creep.memory.target_id = false;
            //     creep.memory.role = 'harvest';
            // }
            var current_workers = units['total'] - units['harvest'];
            var current_creep_types = global_vars.creep_types[my_spawn.memory.general.status];
//            console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: CREEP_TYPES: ' + JSON.stringify(current_creep_types));
            //TODO: Improve pleace of tower. don't search per creep
            let towers = my_room.find(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER && (object.energy/object.energyCapacity < 0.8))});
            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: ROOM MEMORY: ' + JSON.stringify(my_room.memory));
            // if (towers && !my_room.memory.towers.all_full) targets = towers;
            if (towers && towers.length > 0) targets = towers;
            else {
                targets = my_room.find(FIND_STRUCTURES,
                    {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN || object.structureType === STRUCTURE_LINK)
                    && (object.energy < object.energyCapacity))});
//            console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS targets: ' + targets.length + '; current TRANSFER %: ' + units['transfer']/current_workers + ';limit: '+ current_creep_types.transfer[my_room.controller.level]);
            }
            if ((targets.length != 0 && (units['transfer']/current_workers < current_creep_types.transfer[my_room.controller.level]))) {
                creep.say('transfering');
                creep.memory.role = 'transfer';
//                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                //units.transfer++;
            } else if (my_room.memory.targets.repair_defence && units['repair_defence']/current_workers < current_creep_types.repair_defence) {
                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Changed ' + creep.memory.role + ' to repair_defence: ' + units['repair_defence'] + ' / ' + current_workers + '=' + units['repair_defence']/current_workers + '[' + current_creep_types.repair_defence +']')
                creep.say('defence repair');
                creep.memory.role = 'repair_defence';
                //units.repair_defence++;
            } else if (my_room.memory.targets.repair_civilian && units['repair_civilian']/current_workers < current_creep_types.repair_civilian) {
                creep.say('civilian repair');
                creep.memory.role = 'repair_civilian';
                //units.repair_civilian++;
            } else if (my_room.memory.targets.build && units['build']/current_workers < current_creep_types.build) {
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
                break;
            case 'miner':
                role_miner.run(creep);
                break;
            case 'transfer':
                // var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.transfer));
                var target;
                if (creep.memory.target_id && (Game.time < global_vars.update_period.target)) target = Game.getObjectById(creep.memory.target_id);
                else {
                    target = creep.pos.findClosestByPath(targets);
                    creep.memory.target_id = (target ? target.id: false);
                    creep.memory.next_taget_update = Game.time + global_vars.update_period.target;
                }
                if (target) {
                    //                   console.log('[DEBUG] (structCreep-transfer)[' + creep.name + ']: Target: ' + JSON.stringify(target.pos));
                    let act_response = creep.transfer(target, RESOURCE_ENERGY);
                    if (act_response === ERR_FULL) {
                        creep.memory.target_id = false;
                    } else creep_helpers.most_creep_action_results(creep, target, act_response, creep_role);
                } else creep.memory.role = 'undefined';     // All stuctures are full
                break;
            case 'repair_defence':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_defence));
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'repair_civilian':
                //               var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_civilian));
                var target = Game.getObjectById(my_room.memory.targets.repair_civilian); // the most targets are roads => stuck on them
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'build':
                //console.log(creep.name + '-MemBuild: ' + JSON.stringify(my_room.memory.targets.build[0].id));
                //var target = creep.pos.findClosestByRange(my_room.memory.targets.build);
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.build));
                //console.log(creep.name + '-Build: ' + target.id);
                if (target) {
                    var action_res = creep.build(target);
                    switch(action_res) {
                        case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                            my_room.memory.targets.build = false;
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
