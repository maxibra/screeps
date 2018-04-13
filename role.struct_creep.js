var creep_helpers = require('creep_helpers');
var role_harvester = require('role.harvester');
var role_long_harvester = require('role.long_harvester');
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
        let log_name = 'stam';
        let controller_position = Game.rooms['E39N49'].controller.pos;

        let condition2change_role = (iam_general && ((creep.memory.role === 'harvest' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) ||
            creep.memory.role === 'undefined'));
                
        // *** LOG
        if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Controller: ' + JSON.stringify(controller_position) + '; Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        // ********
        // *** UNIT LOG
        if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: long_harvester: ' + JSON.stringify(my_room.memory.energy_flow.long_harvester));
        // ********
 
        var transfer_target;
        var source_away = false;
        // Game.spawns['max'].spawnCreep([MOVE,MOVE,MOVE,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH], 'claimer1', {'role': 'claimer'})
        // if ((creep.name.substring(0,7) === 'max_new') && (creep.name.substring(0,7) !== 'max_new-20') && (creep.name.substring(0,7) !== 'max_new-21') && (creep.room.name === 'E34N47')) {
        if (creep.spawning) {
        } else if ((creep.name === 'max_new-21')) creep.memory.role = 'attack';
        else if ((creep.name.substring(0,7) === 'max_new') && (creep.room.name !== 'E34N47')) {
            creep.memory.role = 'claimer';
        // } else if (creep.name.substring(0,9) === 'lng_hrvst') {
        //     creep.memory.role = 'long_harvest';
        } else if (room_name === 'E33N47') {    // Go back to room with X mineral
            creep.memory.role = 'go_close';
        } else if((Object.keys(creep.carry).length === 1 && creep.carry.energy === 0) || creep.memory.role === 'harvest') {
                creep.memory.role = 'harvest';
                creep.memory.target_id == false;                
        // } else if ((room_vars.status === 'peace' && units[room_name]['upgrade'] < 1 && units[room_name]['total'] >= 3 && creep.ticksToLive > 900) || creep.pos.getRangeTo(Game.rooms[room_name].controller) < 4) {
        } else if ( (creep.pos.getRangeTo(Game.rooms[room_name].controller) < 4 && units[room_name]['total'] > 2)||
                    (room_vars.status === 'peace' && units[room_name]['total'] >= 3 && creep.ticksToLive > 1000 &&
                    units[room_name]['upgrade'] === 0)) {
                    // creep.room.lookForAtArea(LOOK_CREEPS,controller_position.y-3,controller_position.x-3,controller_position.y+3,controller_position.x+3, true).length === 0)) {
            if (creep.memory.role !== 'upgrade') creep.say('upgrading');
            creep.memory.role = 'upgrade';
            units[room_name]['upgrade']++;
        } else if (condition2change_role) {
            var current_workers = units[room_name]['total'] - units[room_name]['energy'] - units[room_name]['minerals'];
            var current_creep_types = room_vars.creep_types[room_vars.status];
            //TODO: Improve pleace of tower. don't search per creep
            let transfer_procent = units[room_name]['transfer']/current_workers;

            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfers: ' + transfer_procent +' / ' + current_creep_types.transfer);
            // ********
            transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER && (object.energy/object.energyCapacity < 0.8))});
            if (transfer_target && !my_room.memory.towers.current[transfer_target.id]) my_room.memory.towers.current[transfer_target.id] = creep.name;
            else {  // transfer to link
                transfer_target = false;
                for (let l in my_room.memory.energy_flow.links.sources) {
                    cur_transfer_target = Game.getObjectById(my_room.memory.energy_flow.links.sources[l]);
                    if (cur_transfer_target && 
                        ((cur_transfer_target.energy/cur_transfer_target.energyCapacity < 0.7) && (creep.pos.getRangeTo(cur_transfer_target) < 7) ||
                        (creep.pos.isNearTo(cur_transfer_target) && cur_transfer_target.energy < cur_transfer_target.energyCapacity))) {
                        transfer_target =  cur_transfer_target;
                        break;
                    }
                }
                
                if(!transfer_target) { // transfer to extensions or spawn
                    transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                        && (object.energy < object.energyCapacity))});
                }
            }
            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS target: ' + transfer_target);
            // ********
            if(transfer_target && (transfer_procent < current_creep_types.transfer)) {
                creep.say('transfering');
                creep.memory.role = 'transfer';

                // *** UNIT LOG
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                // ********

                //units[room_name].transfer++;
            } else if (my_room.memory.targets.build && units[room_name]['build']/current_workers < current_creep_types.build) {
                creep.say('building');
                creep.memory.role = 'build';
                units[room_name].build++;
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
            // } else if (my_room.memory.energy_flow.storage || my_room.memory.energy_flow.terminal) {
            //     let storages = [];
            //     if (my_room.memory.energy_flow.storage) storages.push(Game.getObjectById(my_room.memory.energy_flow.storage));
            //     if (my_room.memory.energy_flow.terminal) storages.push(Game.getObjectById(my_room.memory.energy_flow.terminal));
            //     creep.say('transfering');
            //     creep.memory.role = 'transfer';
            //     transfer_target = creep.pos.findClosestByPath(storages);
            } else if (units[room_name].upgrade === 0 || room_name == 'E34N47') {
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
                role_harvester.run(creep, iam_general, units[room_name]['mineral']);
                break;
            case 'long_harvest':
                role_long_harvester.run(creep);
                break;                
            case 'miner':
                role_miner.run(creep);
                break;
            case 'transfer':

                let cur_transfer_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : transfer_target;
                creep.memory.target_id = cur_transfer_target.id;
 
                // let act_response;
                // creep.memory.resources
                // if (creep.memory.resources) {   // Has minerals
                //     for (let r in creep.memory.resources) {
                //         act_response = creep.transfer(cur_transfer_target, creep.memory.resources[r]);
                //         creep_helpers.most_creep_action_results(creep, cur_transfer_target, act_response, creep_role);
                //     }
                //     creep.memory.resources = false;
                // } else {
                    let energy_missing = cur_transfer_target.energyCapacity - cur_transfer_target.energy;
                    let energy2transfer = (energy_missing < creep.carry[RESOURCE_ENERGY] ? energy_missing : creep.carry[RESOURCE_ENERGY]);
                    act_response = creep.transfer(cur_transfer_target, RESOURCE_ENERGY, energy2transfer);
                    creep_helpers.most_creep_action_results(creep, cur_transfer_target, act_response, creep_role);
                // }
                
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
                // creep.moveTo(Game.getObjectById('59f1c0062b28ff65f7f212d9'), global_vars.moveTo_ops);   // go to source in new room
                // creep.moveTo(new RoomPosition(5,26,'E35N46'), global_vars.moveTo_ops);   // go to source in new room
                if ((creep.name === 'max_new-20' || creep.name === 'max_new-21') && creep.room.name === 'E34N47') {
                    creep.memory.role = 'attack';
                    creep.moveTo(new RoomPosition(41,32,'E34N47'), global_vars.moveTo_ops)
                }else 
                if (creep.room.name === 'E34N47' && creep.pos.y <= 44) creep.memory.role = 'undefined';
                else if (creep.room.name === 'E35N46' && creep.pos.x > 41 && creep.pos.y < 15) creep.moveTo(new RoomPosition(43,17,'E35N46'), global_vars.moveTo_ops);
                else if (creep.room.name === 'E35N46' && creep.pos.x > 8) creep.moveTo(new RoomPosition(8,24,'E35N46'), global_vars.moveTo_ops);
                else if (((creep.room.name === 'E35N46' && creep.pos.x <= 8) || creep.room.name === 'E34N46' || creep.room.name === 'E34N47')) creep.moveTo(new RoomPosition(43,20,'E34N47'), global_vars.moveTo_ops);

                else 
                    creep.moveTo(new RoomPosition(8,24,'E35N46'), global_vars.moveTo_ops);   // go to source in new room

                break;
            case 'attack':
                creep.moveTo(Game.getObjectById('5a960d27d98dab5a882402bc'), global_vars.moveTo_ops)
                // if (creep.room.name === 'E38N49') creep.memory.role = 'undefined';
                break;                
            case 'go_close':
                if (room_name === 'E34N47' && creep.pos.x > 12) creep.memory.role = 'undefined';
                else creep.moveTo(Game.getObjectById('5acc7c285fd31939643fd4fe'), global_vars.moveTo_ops);
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
