var creep_helpers = require('creep_helpers');
var role_harvester = require('role.harvester');
var role_miner = require('role.miner');
//var global_vars = require('global_vars')();

// var spawn_name = 'max';
// var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
// var my_room = Game.rooms[global_vars.room_name];
var global_vars = Memory.rooms.global_vars;

var structCreep = {
    run: function(creep, units) {
        // role's definition
        let room_name = creep.room.name;
        let my_room = Game.rooms[room_name];
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let iam_general = (typeof creep.memory.special === "undefined");
        let log_name = 'max_new7';

        var condition2change_role = (iam_general && ((creep.memory.role === 'harvest' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) ||
            creep.memory.role === 'undefined'));

        // if (creep.ticksToLive < 2)
        //     room_towers = Object.keys(my_room.memory.towers.current);
        //     for (let i in room_towers)
        //         if (my_room.memory.towers.current[room_towers[i]] === creep.id) {
        //             my_room.memory.towers.current[room_towers[i]] = false;
        //             creep.suicide
        //         }
        // *** LOG
        // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        // ********

        var transfer_target;
        // Game.spawns['max'].spawnCreep([MOVE,MOVE,MOVE,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH], 'claimer1', {'role': 'claimer'})
        if ((creep.name.substring(0,7) === 'max_new') && (room_name === 'E38N49' || room_name === 'E39N49')) creep.memory.role = 'claimer';
        else if(creep.carry.energy === 0 || creep.memory.role === 'harvest') {
            if (creep.memory.role !== 'harvest') creep.say('harvesting');
            creep.memory.role = 'harvest';
            creep.memory.target_id == false;
        } else if ((room_name !== 'E38N49') && (units[room_name]['upgrade'] < 3) && (creep.pos.getRangeTo(Game.rooms[room_name].controller) < 4) || ((units[room_name]['total'] > 3) && (creep.ticksToLive > 1300))) {
            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: FIRST to upgrade');
            if (creep.memory.role !== 'upgrade') creep.say('upgrading');
            creep.memory.role = 'upgrade';
        } else if (condition2change_role) {
            var current_workers = units[room_name]['total'] - units[room_name]['harvest'];
            var current_creep_types = room_vars.creep_types[room_vars.status];
            //TODO: Improve pleace of tower. don't search per creep
            let transfer_procent = units[room_name]['transfer']/current_workers;

            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfers: ' + transfer_procent +' / ' + current_creep_types.transfer[my_room.controller.level]);
            // ********

            transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER && (object.energy/object.energyCapacity < 0.8))});
            if (transfer_target && !my_room.memory.towers.current[transfer_target.id]) my_room.memory.towers.current[transfer_target.id] = creep.id;
            else {
                transfer_target = Game.getObjectById(my_room.memory.energy_flow.links.source);
                if (!(transfer_target && (transfer_target.energy/transfer_target.energyCapacity < 0.9) && (creep.pos.getRangeTo(transfer_target) < 7))) {
                    transfer_target = creep.pos.findClosestByPath(FIND_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                        && (object.energy < object.energyCapacity))});
                }
            }
            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS target: ' + transfer_target);
            // ********
            if(transfer_target && (transfer_procent < current_creep_types.transfer[my_room.controller.level])) {
                creep.say('transfering');
                creep.memory.role = 'transfer';

                // *** UNIT LOG
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                // ********

                //units[room_name].transfer++;
            } else if (my_room.memory.targets.repair_defence && units[room_name]['repair_defence']/current_workers < current_creep_types.repair_defence) {

                // *** GLOBAL LOG
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Changed ' + creep.memory.role + ' to repair_defence: ' + units[room_name]['repair_defence'] + ' / ' + current_workers + '=' + units[room_name]['repair_defence']/current_workers + '[' + current_creep_types.repair_defence +']')
                // ********

                creep.say('defence repair');
                creep.memory.role = 'repair_defence';
                //units[room_name].repair_defence++;
            } else if (my_room.memory.targets.repair_civilian && units[room_name]['repair_civilian']/current_workers < current_creep_types.repair_civilian) {
                creep.say('civilian repair');
                creep.memory.role = 'repair_civilian';
                //units[room_name].repair_civilian++;
            } else if (my_room.memory.targets.build && units[room_name]['build']/current_workers < current_creep_types.build) {
                creep.say('building');
                creep.memory.role = 'build';
                units[room_name].build++;
            } else if (room_name !== 'E39N49') {  // Here if no jobs instead upgrading
                creep.say('upgrading');
                creep.memory.role = 'upgrade';
                //units[room_name].upgrade++;
            } else if (units[room_name].upgrade === 0 && creep.ticksToLive > 300) {
                creep.say('upgrading');
                creep.memory.role = 'upgrade';
            }
            // }
            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: CHANGED ROLE: ' + JSON.stringify(creep.memory));
            creep.memory.target_id = false;
        }

        // Action per role
        let creep_role = creep.memory.role;
        switch(creep_role) {
            case 'harvest':
                role_harvester.run(creep, iam_general);
                break;
            case 'miner':
                role_miner.run(creep);
                break;
            case 'transfer':
                let cur_transfer_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : transfer_target;
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] WTF');
                creep.memory.target_id = cur_transfer_target.id;
                let energy_missing = cur_transfer_target.energyCapacity - cur_transfer_target.energy;
                let energy2transfer = (energy_missing < creep.carry[RESOURCE_ENERGY] ? energy_missing : creep.carry[RESOURCE_ENERGY]);
                let act_response = creep.transfer(cur_transfer_target, RESOURCE_ENERGY, energy2transfer);
                creep_helpers.most_creep_action_results(creep, cur_transfer_target, act_response, creep_role);
                break;
            case 'repair_defence':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_defence));
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'repair_civilian':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_civilian));
                // var target = Game.getObjectById(my_room.memory.targets.repair_civilian); // the most targets are roads => stuck on them
                if (target && target.hits/target.hitsMax <= 0.8) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else {
                    creep.memory.role = 'undefined';
                    creep.memory.target_id = false;
                }
                break;
            case 'build':
                //console.log(creep.name + '-MemBuild: ' + JSON.stringify(my_room.memory.targets.build[0].id));
                //var target = creep.pos.findClosestByRange(my_room.memory.targets.build);
                // var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.build));
                let build_target;
                if (creep.memory.target_id)  build_target = Game.getObjectById(creep.memory.target_id);
                else {
                    let targets_obj = [];
                    for (let i in my_room.memory.targets.build) targets_obj.push(Game.getObjectById(my_room.memory.targets.build[i]));
                    build_target = creep.pos.findClosestByRange(targets_obj);
                }
                //console.log(creep.name + '-Build: ' + target.id);
                if (build_target) {
                    var action_res = creep.build(build_target);
                    // console.log('[DEBUG] (structCreep-build)[' + creep.name + ']: Target: ' + JSON.stringify(target.id) + '; ACTION_RES: ' + action_res);
                    switch(action_res) {
                        case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                            my_room.memory.targets.build = false;
                            creep.memory.role = 'undefined';
                            creep.memory.target_id = false;
                            break;
                        default:
                            creep_helpers.most_creep_action_results(creep, build_target, action_res, creep_role);
                            creep.memory.target_id = false;
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
            case 'claimer':
                creep.moveTo(Game.getObjectById('59f1a59182100e1594f3eb89'), global_vars.moveTo_ops);   // go to source in new room
                if (creep.room.name === 'E38N48') creep.memory.role = 'undefined';
                break;
            case 'go_close':
                if (creep.pos.isNearTo('5a99c2e49340d4525da5a48f')) creep.memory.role = 'undefined';
                else creep.moveTo(Game.getObjectById('5a99c2e49340d4525da5a48f'), global_vars.moveTo_ops);
                break;
            default:
                console.log('[ERROR] (structCreep): No role defined for ' + creep.name + '; ROLE: ' + creep_role);
        }

        {    // HARVEST

            //console.log('Source:' + source);
            //return [source.pos.x, source.pos.y];
        }
    }
};

module.exports = structCreep;
