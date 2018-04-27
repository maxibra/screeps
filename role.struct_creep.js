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
        if(creep.spawning) return;
        // role's definition
        let room_name = creep.room.name;
        let my_room = Game.rooms[room_name];
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let iam_general = (typeof creep.memory.special === "undefined");
        let log_name = 'stam';
        let controller_position = Game.rooms['E39N49'].controller.pos;
        let far_source = Game.getObjectById('59f1a54882100e1594f3e357');

        // if(room_name === 'E38N47') return;

        if (creep.name === log_name ) console.log('[' + creep.name + '] : ' + JSON.stringify(creep.memory))

        let condition2change_role = (iam_general && ((creep.memory.role === 'harvest' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) ||
            creep.memory.role === 'undefined'));
                
        // *** LOG
        if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Time: ' + Game.time + '; Controller: ' + JSON.stringify(controller_position) + '; Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        // ********
        // *** UNIT LOG
        // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: long_harvester: ' + JSON.stringify(my_room.memory.energy_flow.long_harvester));
        // ********
 
        var transfer_target;
        var source_away = false;
        
        // Game.spawns['max'].spawnCreep([MOVE,MOVE,MOVE,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH], 'claimer1', {'role': 'claimer'})
        if (creep.memory.special) {
            // Do nothing
        } else if (creep.memory.has_minerals) {
            creep.memory.role = 'transfer';
            transfer_target = Game.getObjectById(my_room.memory.energy_flow.storage);
        } else if (creep.name === 'its_my') {
            creep.memory.role = 'its_my';
        } else if (creep.name.substring(0,13) === 'energy_helper') {
            creep.memory.role = 'energy_helper';
        } else if ((creep.name.substring(0,7) === 'max_new') && room_name !== 'E38N47') {
            creep.memory.role = 'claimer';
        } else if (creep.name.substring(0,7) === 'max_new' && room_name === 'E38N47' && room_vars.status === 'war' && creep.pos.y > 14 && creep.pos.x < 18) {
            creep.memory.role = 'go_close';
        
        // } else if (creep.name.substring(0,9) === 'lng_hrvst' ) { // && creep.ticksToLive > 1499 && !creep.memory.homeland && creep.memory.homeland !== room_name) {
        //     creep.memory = {
        //                 role: 'long_harvest', 
        //                 harvester_type: 'move_away', 
        //                 target_id: my_room.memory.energy_flow.long_harvest[0],
        //                 homeland: room_name,
        //                 special: 'long_harvest',
        //                 homeland_target: my_room.controller.pos
        //     }
        } else if (room_name === 'E33N47') {    // Go back to room with X mineral
            creep.memory.role = 'go_close';
        } else if (creep.carry.energy === 0 && creep.memory.special === 'long_harvest') {
            creep.memory.role = 'long_harvest';
            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: ROOM MEM: ' + JSON.stringify(my_room.memory.energy_flow));
        } else if(creep.carry.energy === 0 || creep.memory.role === 'harvest') {
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Go harvets');
            creep.memory.role = 'harvest';
            creep.memory.target_id == false;                
        // } else if ((room_vars.status === 'peace' && units[room_name]['upgrade'] < 1 && units[room_name]['total'] >= 3 && creep.ticksToLive > 900) || creep.pos.getRangeTo(Game.rooms[room_name].controller) < 4) {
        } else if (((creep.pos.getRangeTo(Game.rooms[room_name].controller) < 5 && units[room_name]['total'] >= 2 && 
                                (my_room.controller.level < 8 || (my_room.controller.level === 8 && my_room.controller.ticksToDowngrade < 149900))) ||
                    (room_vars.status === 'peace' && units[room_name]['total'] >= 2 && creep.ticksToLive > 1000 && units[room_name]['upgrade'] < 1 && my_room.controller.level !== 8) ||
                    (my_room.controller.level === 8 && my_room.controller.ticksToDowngrade < 139000 && units[room_name]['upgrade'] < 1) ) && 
                  (creep.pos.getRangeTo(far_source) > 5) && !(room_name === 'E38N47' && room_vars.status == 'war')){
                    // creep.room.lookForAtArea(LOOK_CREEPS,controller_position.y-3,controller_position.x-3,controller_position.y+3,controller_position.x+3, true).length === 0)) {
            if (creep.memory.role !== 'upgrade') creep.say('upgrading');
            creep.memory.role = 'upgrade';
            units[room_name]['upgrade']++;
        } else if (condition2change_role) {
            var current_workers = units[room_name]['total'] - units[room_name]['harvest'];
            var current_creep_types = room_vars.creep_types[room_vars.status];
            //TODO: Improve pleace of tower. don't search per creep
            let transfer_procent = units[room_name]['transfer']/current_workers;

            // *** UNIT LOG
            if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfers: ' + transfer_procent +' / ' + current_creep_types.transfer);
            // ********
            transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER && (object.energy/object.energyCapacity < 0.8))});

            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS target TOWER: ' + transfer_target);
            // ********
            if (room_name === 'E34N47' && creep.pos.isNearTo(far_source)) {
                transfer_target = Game.getObjectById('5ad1a3171db6bf2fc4648b26');
                creep.memory.role = 'transfer';
            } else if (transfer_target && !my_room.memory.towers.current[transfer_target.id]) {
                // *** LOG
                if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target TOWER: ' + JSON.stringify(transfer_target));
                creep.say('transfering');
                creep.memory.role = 'transfer';
                my_room.memory.towers.current[transfer_target.id] = creep.name;
            } else {  
                transfer_target = false; 
                for (let l in my_room.memory.energy_flow.links.sources) { // try transfer to link
                    cur_transfer_target = Game.getObjectById(my_room.memory.energy_flow.links.sources[l]);
                    if (cur_transfer_target && 
                        ((cur_transfer_target.energy/cur_transfer_target.energyCapacity < 0.7) && (creep.pos.getRangeTo(cur_transfer_target) < 7) ||
                        (creep.pos.isNearTo(cur_transfer_target) && cur_transfer_target.energy < cur_transfer_target.energyCapacity))) {
                        transfer_target =  cur_transfer_target;
                        break;
                    }
                }
                if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target LINK: ' + JSON.stringify(transfer_target));
                if(!transfer_target) { // transfer to extensions or spawn
                    transfer_target = creep.pos.findClosestByPath(FIND_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                        && (object.energy < object.energyCapacity))});
                }
                // *** LOG
                if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target: ' + JSON.stringify(transfer_target));
                if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Terminal cond: ' + (my_room.memory.global_vars.all_full))
                if(transfer_target && (transfer_procent < current_creep_types.transfer)) {
                    creep.say('transfering');
                    creep.memory.role = 'transfer';
    
                    // *** UNIT LOG
                    // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                    // ********
    
                    //units[room_name].transfer++;
                } else if (my_room.memory.targets.repair_civilian && units[room_name]['repair_civilian']/current_workers < current_creep_types.repair_civilian) {
                    creep.say('civilian repair');
                    creep.memory.role = 'repair_civilian';
                    //units[room_name].repair_civilian++;
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
                    // Return here repair
                } else if (my_room.memory.energy_flow.terminal && my_room.memory.global_vars.all_full && room_name !== 'E37N48') {
                    creep.say('transfering');
                    creep.memory.role = 'transfer';
                    transfer_target = Game.getObjectById(my_room.memory.energy_flow.terminal);
                } else if (my_room.memory.energy_flow.storage && my_room.memory.global_vars.all_full) {
                    creep.say('transfering');
                    creep.memory.role = 'transfer';
                    transfer_target = Game.getObjectById(my_room.memory.energy_flow.storage);
                } else if (room_name !== 'E39N49' && creep.pos.getRangeTo(far_source) > 5 && !(room_name === 'E38N47' && my_room.memory.global_vars.status === 'war')) {
                    creep.say('upgrading');
                    creep.memory.role = 'upgrade';
                }
                // }
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: CHANGED ROLE: ' + JSON.stringify(creep.memory));
                creep.memory.target_id = false;
            }
        }
                
        // Action per role
        let creep_role = creep.memory.role;
        switch(creep_role) {
            case 'mineral_miner':
                if (creep.carry[my_room.memory.energy_flow.mineral.type] === creep.carryCapacity) {
                    let room_terminal = Game.getObjectById(my_room.memory.energy_flow.terminal);
                    let terminal_status = _.sum(room_terminal.store)
                    let transfer_target = (terminal_status < 250000) ? room_terminal : Game.getObjectById(my_room.memory.energy_flow.storage);
                    if (creep.transfer(transfer_target, my_room.memory.energy_flow.mineral.type) !== OK) creep.moveTo(transfer_target, global_vars.moveTo_ops);
                } else {
                    let room_mineral = Game.getObjectById(my_room.memory.energy_flow.mineral.id);
                    // console.log('[DEBUG][' + creep.name + ']: MINERAL harvest. Type: ' + my_room.memory.energy_flow.mineral.type + '; Target: ' + room_mineral.id + '; HARVEST: ' + creep.harvest(room_mineral))
                    if (creep.harvest(room_mineral) !== OK) creep.moveTo(room_mineral, global_vars.moveTo_ops);
                }
                break;
            case 'energy_miner':
                let source_containers = my_room.memory.energy_flow.containers.source;
                let cntnr_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                if (!cntnr_target) {
                    for (let c in source_containers) {
                        console.log('[' + creep.name + ']: CNTRN: ' + c + '; ' + JSON.stringify(Game.getObjectById(c)))
                        if (my_room.memory.energy_flow.containers.source[c].miner_id) {
                            if (!Game.getObjectById(my_room.memory.energy_flow.containers.source[c].miner_id)) 
                                my_room.memory.energy_flow.containers.source[c].miner_id = false
                        } else {
                            cntnr_target = Game.getObjectById(c);
                            break;
                        } 
                    }
                    creep.memory.target_id = cntnr_target.id;
                    my_room.memory.energy_flow.containers.source[cntnr_target.id].miner_id = creep.id;
                }

                if (creep.pos.x !== cntnr_target.pos.x || creep.pos.y !== cntnr_target.pos.y) creep.moveTo(cntnr_target, global_vars.moveTo_ops);
                else if (cntnr_target.store['energy'] < cntnr_target.storeCapacity) {
                    // console.log('[' + creep.name + ']: HARVEST' + my_room.memory.energy_flow.containers.source[cntnr_target.id].source_id);
                    creep.harvest(Game.getObjectById(my_room.memory.energy_flow.containers.source[cntnr_target.id].source_id))
                }
                break;
            case 'upgrader':
                if (creep.pos.getRangeTo(my_room.controller) > 3) creep.moveTo(my_room.controller, global_vars.moveTo_ops);
                else if (creep.carry[RESOURCE_ENERGY] === 0) {
                    let closer_link_id = creep.memory.target_id;
                    if (!closer_link_id)
                        for (let l_dst in my_room.memory.energy_flow.links.destinations) {
                            if (Game.getObjectById(my_room.memory.energy_flow.links.destinations[l_dst]).pos.getRangeTo(my_room.controller) < 6) {
                                closer_link_id = my_room.memory.energy_flow.links.destinations[l_dst];
                                creep.memory.target_id = closer_link_id;
                                break;
                            }
                        }
                    let closer_link_target = Game.getObjectById(closer_link_id)
                    if (creep.withdraw(closer_link_target, RESOURCE_ENERGY) !== OK) creep.moveTo(closer_link_target, global_vars.moveTo_ops);
                 } else
                    creep.upgradeController(my_room.controller);
                break;
            case 'its_my':
                let claim_target = new RoomPosition(39, 30, 'E38N47');
                if(creep.pos.getRangeTo(claim_target) === 1) creep.claimController(Game.rooms['E38N47'].controller)
                else creep.moveTo(claim_target, global_vars.moveTo_ops);
                break;
            case 'energy_helper':
                let source_terminal = Game.getObjectById('5ad024eac27319698ef58448');
                if (creep.carry[RESOURCE_ENERGY] === 0) {
                    if (creep.withdraw(source_terminal, RESOURCE_ENERGY) !== OK) creep.moveTo(source_terminal);
                } else {
                    let dst_containers = ['5adfbd7de9560f0a300272ce', '5adfdc2128fc8b0ef2d913c6'];
                    let cur_container = Game.getObjectById(dst_containers[0]);
                    for (let c in dst_containers) {
                        cur_container = Game.getObjectById(dst_containers[c]);
                        let energy_missing = cur_container.storeCapacity - cur_container.store[RESOURCE_ENERGY];
                        if (energy_missing > 0) {
                            if (!creep.pos.isNearTo(cur_container)) creep.moveTo(cur_container, global_vars.moveTo_op);
                            else {
                                let energy2transfer = (energy_missing < creep.carry[RESOURCE_ENERGY] ? energy_missing : creep.carry[RESOURCE_ENERGY]);
                                let act_response = creep.transfer(cur_container, RESOURCE_ENERGY, energy2transfer);
                            }
                            break;
                        }
                    }
                }
                break;
            case 'harvest':
                role_harvester.run(creep, iam_general);
                break;
            case 'long_harvest':
                console.log('[DEBUG] (structCreep.run)[' + creep.name + '] RUN long harvester role');
                role_long_harvester.run(creep);
                break;                
            case 'miner':
                role_miner.run(creep);
                break;
            case 'transfer':
                let cur_transfer_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : transfer_target;
                if (!cur_transfer_target) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFER TARGET??? : ' + JSON.stringify(cur_transfer_target));
                creep.memory.target_id = cur_transfer_target.id;
                let energy_missing = cur_transfer_target.energyCapacity - cur_transfer_target.energy;
                let energy2transfer = (energy_missing < creep.carry[RESOURCE_ENERGY] ? energy_missing : creep.carry[RESOURCE_ENERGY]);
                let act_response = creep.transfer(cur_transfer_target, RESOURCE_ENERGY, energy2transfer);
                creep_helpers.most_creep_action_results(creep, cur_transfer_target, act_response, creep_role);
                let creep_minerals = Object.keys(creep.carry)
                if (cur_transfer_target.id === my_room.memory.energy_flow.storage && creep_minerals.length > 1) {
                    for (let m in creep_minerals) creep.transfer(cur_transfer_target, creep_minerals[m]);
                    creep.memory.role = 'undefined';
                    creep.memory.target_id = false;
                    if (Object.keys(creep.carry).length === 1) creep.memory.has_minerals = false;
                }
                break;
            case 'repair_defence':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_defence));
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'repair_civilian':
                // var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_civilian));
                var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_ROAD || object.structureType == STRUCTURE_CONTAINER) && object.hits/object.hitsMax <= 0.8});
                // var target = Game.getObjectById(my_room.memory.targets.repair_civilian); // the most targets are roads => stuck on them
                if (target) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else {
                    creep.memory.role = 'build';
                    // creep.memory.role = 'undefined';
                    // creep.memory.target_id = false;
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

                // build_target = false
                if (build_target) {
                    var action_res = creep.build(build_target);
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
                far_target = new RoomPosition(18,10,'E38N47');
                creep.moveTo(far_target, global_vars.moveTo_ops);   // go to source in new room
                // if (creep.room.name === 'E34N46' || creep.room.name === 'E34N47') creep.moveTo(new RoomPosition(43,20,'E34N47'), global_vars.moveTo_ops);
                if (creep.room.name === 'E38N47') {     // Need if creep came with any energy
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Change to undefined') 
                    creep.memory.role = 'undefined';
                }
                break;
            case 'attack':
                creep.moveTo(Game.getObjectById('5ab049466c3a8506b17046b2'), global_vars.moveTo_ops);   // go to source in new room
                // if (creep.room.name === 'E38N49') creep.memory.role = 'undefined';
                break;                
            case 'go_close':
                let c_id = false;
                switch (creep.room.name) {
                    case 'E34N47':
                        if (creep.pos.x > 18 && creep.pos.y < 13) creep.memory.role = 'undefined';
                        else c_id = my_room.memory.energy_flow.mineral.id;
                        break;
                    case 'E38N47':
                        if (creep.pos.y < 13) creep.memory.role = 'undefined';
                        c_id = '5adfae5e7f213c45818519f0';  // container
                        break;                        
                    default:
                        creep.memory.target_id = false;
                        creep.memory.harvester_type = false;                        
                }
                if (c_id) creep.moveTo(Game.getObjectById(c_id), global_vars.moveTo_ops);
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
