var creep_helpers = require('creep_helpers');
var role_harvester = require('role.harvester');
var role_long_harvester = require('role.long_harvester');
var role_miner = require('role.miner');
//var global_vars = require('global_vars')();

// var spawn_name = 'max';
// var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
// var my_room = Game.rooms[global_vars.room_name];
var global_vars = Memory.rooms.global_vars;

function build_action(my_room, creep) {
    let build_target;
    if (creep.memory.target_id) build_target = Game.getObjectById(creep.memory.target_id);
    else {
        let targets_obj = [];
        for (let i in my_room.memory.targets.build) {
            // if (my_room.memory.targets.build[i] === '5b2e4fb63d76a1365b5e098e') continue;
            targets_obj.push(Game.getObjectById(my_room.memory.targets.build[i]));
        }
        build_target = creep.pos.findClosestByRange(targets_obj);
    }
    
    // build_target = false
    if (build_target) {
        let action_res = creep.build(build_target);
        switch(action_res) {
            case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                my_room.memory.targets.build = false;
                creep.memory.role = 'undefined';
                creep.memory.target_id = false;
                break;
            default:
                creep_helpers.most_creep_action_results(creep, build_target, action_res, 'build');
                creep.memory.target_id = false;
        }
    } else creep.memory.role = 'undefined';
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key].type === value);
}

function get_missing_reagent_labs(my_room) {
    let missing_reagent_labs = [];
    for (let l in my_room.memory.labs.reagent) {
        let current_lab = Game.getObjectById(l);
        if (current_lab.mineralAmount < (current_lab.mineralCapacity - Memory.rooms.global_vars.minerals.transfer_batch)) missing_reagent_labs.push(current_lab);
    }   
    return missing_reagent_labs;
}

function get_full_produce_labs(my_room) {
    let full_produce_labs = [];
    for (let l in my_room.memory.labs.produce) {
        let current_lab = Game.getObjectById(l);
        if (current_lab.mineralAmount > Memory.rooms.global_vars.minerals.transfer_batch) full_produce_labs.push(current_lab);
    }   
    return full_produce_labs;
}

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
        let far_source = Game.getObjectById('59f1a54882100e1594f3e357');    // far away source of E34N47
        let range2upgrade = (room_name === 'E38N47') ? 6 : 4;
        
        // if (room_name === 'E34N47') range2upgrade = 5;

        // if(room_name === 'E38N47') return;

        if (creep.name === log_name ) console.log('[' + creep.name + '] : ' + JSON.stringify(creep.memory))

        let condition2change_role = (iam_general && ((creep.memory.role === 'harvest' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) ||
            creep.memory.role === 'undefined'));
                
        // *** LOG
        if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Time: ' + Game.time + '; Controller: ' + JSON.stringify(controller_position) + '; Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        // ********
        // *** UNIT LOG
        if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Creep mem: ' + JSON.stringify(creep.memory));
        // ********
 
        var transfer_target;
        var source_away = false;
        
        // Game.spawns['max'].spawnCreep([MOVE,MOVE,MOVE,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH], 'claimer1', {'role': 'claimer'})
        if (creep.memory.special) {
            // Jump directly to Actions
        } else if (creep.name === 'its_my') {
            creep.memory.role = 'its_my';
        } else if (Object.keys(creep.carry).length > 1) {
            creep.memory.role = 'transfer_mineral'; 
        } else if ((creep.name.substring(0,7) === 'max_new') && !(room_name === 'E28N48' && creep.pos.x < 49)) {
            creep.memory.role = 'claimer';
        } else if (creep.name.substring(0,1) === 'E' && creep.name.substring(0,6) !== room_name) { // Go back back from wrong room
            console.log('[DEBUG] (' + room_name + ']: ' + creep.name.substring(0,6))
            creep.moveTo(Game.rooms[creep.name.substring(0,6)].controller, global_vars.moveTo_ops);
            return;
        } else if(creep.carry.energy === 0 || creep.memory.role === 'harvest') {
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Go harvets');
            creep.memory.role = 'harvest';
            creep.memory.target_id == false;                
        // } else if ( room_name == 'E38N47') {
        //     creep.memory.role = 'repair_defence';
        } else if (my_room.controller.level === 8 && creep.pos.getRangeTo(Game.rooms[room_name].controller) < range2upgrade && !creep.memory.special) {
            creep.memory.role = 'transfer';
            transfer_target = my_room.terminal;
            creep.memory.target_id == my_room.terminal;            
        } else if (my_room.controller.level < 8 &&
                   creep.pos.getRangeTo(Game.rooms[room_name].controller) < range2upgrade && units[room_name]['total'] >= 3 && 
                   !(room_name === 'E33N47' && creep.pos.y < 13) && room_name !== 'E32N49' &&
                   !(room_name === 'E32N49' && my_room.controller.pos.findInRange(FIND_MY_CREEPS, 3).length > 3)) {
        //             (my_room.controller.level < 8 || (my_room.controller.level === 8 && my_room.controller.ticksToDowngrade < 149900))) ||
        //             (room_vars.status === 'peace' && units[room_name]['total'] >= 2 && creep.ticksToLive > 1000 && units[room_name]['upgrade'] < 1 && my_room.controller.level !== 8))) { // ||
        //             // (my_room.controller.level === 8 && my_room.controller.ticksToDowngrade < 139000 && units[room_name]['upgrade'] < 1) ))  && 
        //         //   (creep.pos.getRangeTo(far_source) > 5) && !(room_name === 'E38N47' && room_vars.status == 'war')){
        //             // creep.room.lookForAtArea(LOOK_CREEPS,controller_position.y-3,controller_position.x-3,controller_position.y+3,controller_position.x+3, true).length === 0)) {
            if (creep.memory.role !== 'upgrade') creep.say('upgrading');
            creep.memory.role = 'upgrade';
            units[room_name]['upgrade']++;
        } else if (condition2change_role) {
            var current_workers = units[room_name]['total'] - units[room_name]['harvest'];
            var current_creep_types = room_vars.creep_types[room_vars.status];
            //TODO: Improve pleace of tower. don't search per creep
            let transfer_procent = units[room_name]['transfer']/current_workers;

            if (creep.name === 'max_new-2') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: BUILD condition: ' + (my_room.memory.targets.build)) // && units[room_name]['build']/current_workers < current_creep_types.build));

            // *** UNIT LOG
            if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfers: ' + transfer_procent +' / ' + current_creep_types.transfer);
            // ********
            transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER && (object.energy/object.energyCapacity < 0.8))});

            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS target TOWER: ' + transfer_target);
            // ********
            // if (room_name === 'E34N47' && creep.pos.isNearTo(far_source)) {
            //     transfer_target = Game.getObjectById('5ad1a3171db6bf2fc4648b26');   // ID of far link in the room E34N47
            //     creep.memory.role = 'transfer';
            // } else 
            if (transfer_target && !my_room.memory.towers.current[transfer_target.id]) {
                // *** LOG
                if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target TOWER: ' + JSON.stringify(transfer_target));
                creep.say('transfering');
                creep.memory.role = 'transfer';
                my_room.memory.towers.current[transfer_target.id] = creep.name;
            } else {  
                transfer_target = false; 
                // let range2link = 10;
                if (room_name == 'E38N48' || room_name == 'E39N49') range2link = 15;
                else if (room_name == 'E37N48' || room_name == 'E32N49') range2link = 8
                else if (room_name == 'E38N47' || room_name == 'E36N47') range2link = 10
                else range2link = 4; // 34n47, 33N47 
                
                // let link_sources = (my_room.memory.energy_flow.links.near_sources) ? my_room.memory.energy_flow.links.near_sources : [];
                let link_sources = my_room.memory.energy_flow.links.near_sources;
                link_sources = link_sources.concat(my_room.memory.energy_flow.links.sources);

                // if (room_name === 'E32N49') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] LINKS: ' + link_sources + '; ENgry_FLow: ' + JSON.stringify(my_room.memory.energy_flow.links));

                for (let l in link_sources) { // try transfer to link
                    cur_transfer_target = Game.getObjectById(link_sources[l]);
                    if (cur_transfer_target && 
                        ((cur_transfer_target.energy/cur_transfer_target.energyCapacity < 0.7) && (creep.pos.getRangeTo(cur_transfer_target) < range2link) ||
                        (creep.pos.isNearTo(cur_transfer_target) && cur_transfer_target.energy < cur_transfer_target.energyCapacity))) {
                        transfer_target =  cur_transfer_target;
                        break;
                    }
                }
                // if (room_name === 'E32N49') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target LINK: ' + JSON.stringify(transfer_target));
                if (!transfer_target) { // transfer to extensions or spawn
                    transfer_target = creep.pos.findClosestByPath(FIND_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                        && (object.energy < object.energyCapacity))});
                }
                
                // if (room_name === 'E38N48') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target (EXTENSIONS?): ' + transfer_target.structureType);
                let booster_lab_id = (my_room.memory.labs) ? Object.keys(my_room.memory.labs.booster)[0] : false;
                if (!transfer_target && booster_lab_id) {    
                    let booster_lab = Game.getObjectById(booster_lab_id);
                    if (booster_lab.energy < booster_lab.energyCapacity) transfer_target = booster_lab;
                }
                
                if (!transfer_target) { // transfer to NUKER
                    transfer_target = creep.pos.findClosestByPath(FIND_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_NUKER)
                        && (object.energy < object.energyCapacity))});
                }
                
                // *** LOG
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target: ' + JSON.stringify(transfer_target));
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Terminal cond: ' + (my_room.memory.global_vars.all_full))

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
                    // console.log('[DEBUG][' + creep.name + '] Try run to build: ' )
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
                } else if ((room_name === 'E32N49' || my_room.controller.level === 8) && 
                           my_room.memory.energy_flow.terminal && 
                           my_room.memory.global_vars.all_full && my_room.terminal.store[RESOURCE_ENERGY] < Memory.rooms.global_vars.terminal_max_energy_storage) {
                    creep.say('transfering');
                    creep.memory.role = 'transfer';
                    transfer_target = Game.getObjectById(my_room.memory.energy_flow.terminal);
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFER to terminal: ' + transfer_target);
                } else if ((room_name === 'E32N49' || my_room.controller.level === 8) && 
                           my_room.memory.energy_flow.storage && 
                           my_room.memory.global_vars.all_full) {
                    creep.say('transfering');
                    creep.memory.role = 'transfer';
                    transfer_target = Game.getObjectById(my_room.memory.energy_flow.storage);
                } else if (my_room.controller.level < 8 && room_name !== 'E32N49' && room_name !== 'E38N47' &&
                           creep.pos.getRangeTo(far_source) > 5) {
                    creep.say('upgrading');
                    creep.memory.role = 'upgrade';
                }
                // }
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: CHANGED ROLE: ' + JSON.stringify(creep.memory));
                creep.memory.target_id = false;
            }
        }

                        
        // Action per role
        let creep_role = (creep.memory.special) ? creep.memory.special : creep.memory.role;
        let avoid_rooms = !(room_name === creep.memory.homeland)
    
        // *** UNIT LOG
        // if (room_name == 'E38N48') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Creep role: ' + creep_role);
        // ********
            
        switch(creep_role) {
             case 'lab_assistent':
                // Game.creeps['lab_assistent_E39N49-1-sp'].transfer(Game.getObjectById('5afff958ff9d380d22e3634a'), 'K')
                // Game.creeps['lab_assistent_E39N49-1-sp'].transfer(Game.getObjectById('5ac6205ba6cd8147a71e01d5'), 'K')
                // creep.memory.target_id = false;
                // break
                let closest_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : 
                                                                creep.pos.findClosestByRange([my_room.terminal, my_room.storage, Game.getObjectById(Object.keys(my_room.memory.labs.produce)[0])])
                let i_am_near_closest = creep.pos.isNearTo(closest_target);
                console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Closest: ' + closest_target.structureType + '; Near it: ' + i_am_near_closest + '; taget ID: ' + creep.memory.target_id);
                if (creep.memory.target_id && !i_am_near_closest) {
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Moving to: ' + closest_target.structureType);
                    creep.moveTo(Game.getObjectById(creep.memory.target_id), global_vars.moveTo_ops);
                    break;
                }
                
                const total = _.sum(creep.carry);
                console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Carry: ' + total + ' : ' + JSON.stringify(creep.carry));
                if (total === 0) {  // the creep is empty
                    if (!i_am_near_closest) {
                        console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Define target ID: ' +  closest_target.id);
                        creep.memory.target_id = closest_target.id;
                        break;
                    }
                    
                    // Here if the creep is near structure
                    creep.memory.target_id = false;
                    let labs_missing_reagent = get_missing_reagent_labs(my_room);
                    let missing_reagent_types = labs_missing_reagent.map(t => t.mineralType);
                    switch(closest_target.structureType) {
                        case 'terminal':
                        case 'storage':
                            let src_point = closest_target.structureType;
                            let dst_point = (closest_target.structureType === 'terminal') ? 'storage' : 'terminal';
                            //First check if need to transfer reagent to labs
                            let minerals_amount = 0;
                            for (let mineral_type in missing_reagent_types) {
                                if (my_room[src_point].store[mineral_type] > Memory.rooms.global_vars.minerals.transfer_batch &&
                                    missing_reagent_types.indexOf(mineral_type) > -1){
                                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Mineral: ' + mineral_type + '; Store: ' + my_room[src_point].store[mineral_type] + '; Lab missing:' + missing_reagent_types.indexOf(mineral_type));
                                    if (creep.withdraw(my_room[src_point], mineral_type) === OK) minerals_amount++;
                                }
                            }
                            
                            if (minerals_amount > 0) {
                                creep.memory.target_id = labs_missing_reagent[0].id;
                                break;
                            } else {    // All labs of reagent stage are full
                                // check if produced minerals exist in terminal to transfer to Storage
                                for (let teminal_t in my_room[src_point].store) {
                                    if (missing_reagent_types.indexOf(teminal_t) > -1) {
                                        console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Mineral: ' + mineral_type + '; Store: ' + my_room[src_point].store[mineral_type] + '; Lab missing:' + missing_reagent_types.indexOf(mineral_type));
                                        creep.withdraw(my_room[src_point], teminal_t);     
                                    }
                                }
                                creep.memory.target_id = my_room[dst_point].id;
                            }
                            break;
                        case 'lab':
                            let labs_full_produce = get_full_produce_labs(my_room);
                            let produce_types = labs_full_produce.map(t => t.mineralType);
                            for (let mineral_type in produce_types) {
                                if (my_room.terminal.store[t] > my_room.memory.global_vars.minerals.transfer_batch){
                                    if (creep.withdraw(my_room.terminal, mineral_type) === OK) minerals_amount++;
                                }
                            }                            
                            break;
                        default:
                            console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Structure type isn"t define');    
                    }
                    
                }
                break;
            case 'energy_shuttle':
                let creep_action;
                source_container = Game.getObjectById(Object.keys(my_room.memory.energy_flow.containers.source)[0]);
                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Shuttle energy: ' + creep.carry['energy'] + '; Container: ' + source_container.store['energy']);
                let target2transfer = false;
                
                if (Game.time % 5 > 0) break;
                    
                target2transfer = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => ((object.structureType === STRUCTURE_TOWER || 
                                                                                     object.structureType === STRUCTURE_EXTENSION || 
                                                                                     object.structureType === STRUCTURE_SPAWN) && 
                                                                                    (object.energy/object.energyCapacity < 0.9))});
                if (creep.carry['energy'] === 0 && target2transfer && source_container.store['energy'] > creep.carryCapacity) creep_action = 'withdraw';
                else if (creep.carry['energy'] === 0) {
                    if (source_container.store['energy'] > 500) creep_action = 'withdraw';
                    else creep_action = 'go_close';
                } else if (creep.carry['energy'] > 0 && target2transfer) {
                    creep_action = 'transfer';    
                } else {
                    target2transfer = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LINK && 
                                                                                                          object.energy/object.energyCapacity < 0.8)});
                    if (!target2transfer) target2transfer = my_room.terminal;
                    creep_action = 'transfer';
                }
                
                switch (creep_action) {
                    case 'withdraw':
                        if (creep.withdraw(source_container, RESOURCE_ENERGY) !== 'OK') creep.moveTo(source_container,  global_vars.moveTo_ops);
                        break;
                    case 'go_close':
                        creep.moveTo(Game.getObjectById('5adba2968fd8b75209785401'),  global_vars.moveTo_ops);
                        break;
                    case 'transfer':
                        console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Shuttle energy: ' + source_container.store['energy'] + '; Target: ' + target2transfer.structureType);
                        let energy_missing = target2transfer.energyCapacity - target2transfer.energy;
                        let energy2transfer = (energy_missing < creep.carry[RESOURCE_ENERGY] ? energy_missing : creep.carry[RESOURCE_ENERGY]); 
                        let act_response = creep.transfer(target2transfer, RESOURCE_ENERGY, energy2transfer);
                        creep_helpers.most_creep_action_results(creep, target2transfer, act_response, creep_role);   
                        break;
                }
                break;
            case 'mineral_shuttle':
                let my_room_mineral_type = my_room.memory.energy_flow.mineral.type;
                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Type: ' + my_room_mineral_type + '; Carry: ' + JSON.stringify(creep.carry) + '; Terminal: ' + my_room.terminal.store[my_room_mineral_type] );
                if ((!creep.carry[my_room_mineral_type] || creep.carry[my_room_mineral_type] === 0) && 
                    my_room.terminal.store[my_room_mineral_type] < Memory.rooms.global_vars.minerals.send_room &&
                    creep.withdraw(my_room.storage, my_room.memory.energy_flow.mineral.type) !== 'OK')
                        creep.moveTo(my_room.storage,  global_vars.moveTo_ops);
                    
                break;
            case 're_transfer':
                // let transfer_type = 'energy';
                // let memory_reagents = Game.rooms['E39N49'].memory.labs.reagent;
                // let lab = Game.getObjectById((Object.keys(memory_reagents).find(key => memory_reagents[key].type === transfer_type)))
                // let src_target = my_room.terminal;
                // let dst_target = (lab.mineralAmount < 0.8 * lab.mineralCapacity) ? lab : my_room.storage;
                // let dst_target = (lab.mineralAmount < 0.8 * lab.mineralCapacity) ? lab : my_room.storage;

                // let src_target = my_room.terminal;
                // let dst_target = my_room.storage;
                let src_target = my_room.storage;
                let dst_target = my_room.terminal;
                
                let carry_total = _.sum(creep.carry);
                let creep_carries = Object.keys(creep.carry);
                if (carry_total === 0) {
                    let current_resource = RESOURCE_ENERGY;
                    if (src_target.store[current_resource] < 100000) break;
                    // let current_resource = transfer_type;

                    // for (let r in src_target.store) 
                    //     if (r !== 'energy')  // src_target.store[r] > 40000)
                    //         current_resource = r; 
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: SRCs: ' + JSON.stringify(src_target.store) + '; SRC: ' + current_resource);
                    // if (src_target.store['Z'] > 30000 && creep.withdraw(src_target, current_resource) !== OK) creep.moveTo(src_target, global_vars.moveTo_ops);
                    if (creep.withdraw(src_target, current_resource) !== OK) creep.moveTo(src_target, global_vars.moveTo_ops);
                } else {
                    for (let c in creep_carries) 
                        if (creep.transfer(dst_target, creep_carries[c])) creep.moveTo(dst_target, global_vars.moveTo_ops);
                }
                break;
            case 'remote_energy_miner':
                let room_containers_id = Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.source);
                let first_container_id = room_containers_id[0];
                let rmt_container_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : 
                                                                      Game.getObjectById(first_container_id);
                if (!rmt_container_target) rmt_container_target = new RoomPosition(25,25, creep.memory.far_target)
                // console.log('[DEBUG] (structCreep.run - Remote enrgy miner)(remote_claimer) [' + creep.name + ']: Far Target: ' +  creep.memory.far_target + '; Containers: ' + JSON.stringify(room_containers_id) + '; Remote Target: ' + rmt_container_target + '; Range to target: ' + creep.pos.getRangeTo(rmt_container_target));
                
                if (creep.memory.stuck > 4) {
                    let current_container_id;
                    for (let c in room_containers_id) {
                        if (creep.pos.isNearTo(Game.getObjectById(room_containers_id[c]))) {
                            current_container_index = room_containers_id.indexOf(room_containers_id[c]);
                            let next_container_index = (current_container_index + 1) % room_containers_id.length;
                            rmt_container_target = Game.getObjectById(room_containers_id[next_container_index]);
                            break;
                        }
                    }
                    
                    creep.memory.stuck = 0;
                }


                // if (!rmt_container_target) {
                //     console.log('[ERROR] (structCreep.run-remote_energy_miner)[' + creep.name + ']: No mine is defined: ' + JSON.stringify(creep.memory.far_target));
                //     break;
                // } else {
                //     creep.memory.target_id = first_container_id;
                // }
                
                // console.log('[ERROR] (structCreep.run-remote_energy_miner)[' + creep.name + ']: Container: ' + rmt_container_target);
                if (creep.pos.getRangeTo(rmt_container_target) > 0 && creep.pos.getRangeTo(rmt_container_target) < 3) creep.memory.stuck += 1;
                
                // console.log('[DEBUG] (structCreep.run - Remote enrgy miner)(remote_claimer) [' + creep.name + ']: Target: ' + rmt_container_target.id + '; Range to target: ' + creep.pos.getRangeTo(rmt_container_target));
                if (creep.pos.getRangeTo(rmt_container_target) > 0) creep.moveTo(rmt_container_target, global_vars.moveTo_ops);
                else if (rmt_container_target.id && rmt_container_target.store[RESOURCE_ENERGY] < rmt_container_target.storeCapacity) {
                    // let current_source = 
                    let act_out = creep.harvest(Game.getObjectById(Memory.rooms[creep.memory.far_target].energy_flow.containers.source[rmt_container_target.id].source_id))
                    // if (act_out !== OK) creep.memory.stuck 
                }
                creep.memory.target_id = (rmt_container_target) ? rmt_container_target.id : false;
                break;
            case 'remote_claimer':
                // console.log('[DEBUG] (structCreep.run)(remote_claimer) [' + creep.name + ']: Room: ' +  room_name + '; Far Target: ' + creep.memory.far_target );
                let remote_controller = (room_name == creep.memory.far_target) ? creep.room.controller :
                                                                             new RoomPosition(25, 25, creep.memory.far_target);  
                
                if (creep.reserveController(remote_controller) !== OK) creep.moveTo(remote_controller, global_vars.moveTo_ops);
                if (creep.ticksToLive === 1)
                    my_room.memory.endReservation = Game.time + my_room.controller.reservation.ticksToEnd;
                break;
            case 'remote_harvest':
                let name4log = 'rmt_hrvst_E28N48_E29N48-3-sp';
                // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Mem: ' + JSON.stringify(creep.memory));
                if (creep.carry[RESOURCE_ENERGY] === 0 || creep.memory.role === 'harvest') {
                    let transfer_target = creep.pos.findClosestByRange(FIND_TOMBSTONES,{filter: object => (object.store[RESOURCE_ENERGY] > 200)});
                    if (!transfer_target) {
                        let room_containers = Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.source);
                        room_containers = room_containers.concat(Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.other));
                        let full_containers = [];
                        for (let c in room_containers) {
                            let current_container = Game.getObjectById(room_containers[c]);
                            if (current_container && current_container.store[RESOURCE_ENERGY] >= creep.carryCapacity)
                                full_containers.push(current_container);
                        }
                        transfer_target = creep.pos.findClosestByRange(full_containers);
                    }
                    if (transfer_target) {
                        creep.memory.role = 'withdraw';
                        creep.memory.target_id = transfer_target.id;
                    }
                    creep.memory.role = (transfer_target) ? 'withdraw' : 'harvest';
                } else {
                    if (room_name !== creep.memory.homeland && creep.carry[RESOURCE_ENERGY] === creep.carryCapacity) {
                        creep.memory.role = 'undefined';
                        creep.memory.target_id = false;
                    }
                    if (avoid_rooms && my_room.memory.targets && my_room.memory.targets.build) creep.memory.role = 'build';
                    else {
                        let proc_road_repair = 0.7;
                        let memory_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                        let avoid_repair = [
                            '5b31d6a07cac973a8f2efb60', '5b31d5f8f59a1227aec56b88', '5b31d5a779e0ca2b37bfbeb0', '5b31d57f92a8bd27bf555a84', '5b31d4e6cc4e542ab97ae07b', '5b31d4a35a10125b791cdc9b', '5b31d47d3a025b2a8d85cda5', '5b31d3383791e23e3be51457', '5b31d314c98aa93aba6707cd', '5b31d2e969950119652c1a91', '5b31d20769950119652c1a3a', // E29N48 Upper
                            '5b31ea8bb7a39e2afb96e456', '5b31e31d9f6948406d987d79', '5b31e2f482c736408cf8ca96', '5b31e2572f20cb3a889ab1d1', '5b31e19aae3fa21d8aa7c805', '5b31e173a3e49413d17daf1b', '5b31df323791e23e3be518a0',
                            '5b31df0b1618cc1dc489ca02', '5b31ddc616910013b3cd1543', '5b31dd2bad2c2c3e22176046', '5b31dae98033763dfd7a53fc', '5b31dac2198f8a3deec39829', '5b31dbbaa870582b04c49ec0', '5b31dc290ff34619850c42e6',
                            '5b31dc4e563de53a90020f4a', '5b31dd0216910013b3cd14eb', '5b31e78232d5b83e30067f3c', '5b31e8d37984473e07683d8c', '5b31e8f826a2ec4034eae864', '5b31e90eb669a85b73f880b9', '5b31e9373791e23e3be51c5e',
                            '5b31ea4032d5b83e3006802e', '5b31e7ef224c371982707d8a', '5b31e7c73a025b2a8d85d4e3', '5b31e7a69003761999b038de', '5b31e624563de53a9002134f', '5b3244eb9ea3e436baf9763f', '5b3245e924c2d964cdd0ccbd',
                            '5b3246068041c7369c8184f9', '5b3243b3cb21c464f0c8bd25', '5b3243b09bdc6b31791e1417', '5b3243c9b887947d336f51b7', '5b32453d428a904775a0cbb0', '5b324621fb73b734ee6ef737', '5b3246598041c7369c81851c',
                            '5b324680304fcc47572bf59f', '5b3247008e38cb7cdd867f7d', '5b32469a244d2334f4d08540', '5b32467a8041c7369c818529', '5b3245d42f40a07ce41e5c97', '5b324569ee8b3e7d2d839573', '5b324540ee165b475d311178',
                            '5b3244d8244ab464e46fcba4', '5b3244a584e3097d0e71a446',
                            '5b31d75aae3fa21d8aa7c3d6', '5b31d7392f20cb3a889aada2', '5b31d5cb9308242a8cb059e8', '5b31d5a16300d727f3cc0ab5', '5b31d57617f51a3e1d8faef5', '5b31ea8bb7a39e2afb96e456', // E29N48 down
                            '5b3204f716910013b3cd2593', '5b3204f197b6292807eedf3d', '5b32062492a8bd27bf556ee0', '5b31e70500008f3a7fb19c7c', '5b31e63aef07b51d6df5d079', '5b31e612a3e49413d17db11d', '5b31e5b0e8b6f74059f1781b',   // E29N49
                            '5b31e4f9ad2c2c3e2217632c', '5b31e4d1721aa41381250576', '5b333306843e5364f108dae4', '5b31e459721aa4138125054e', '5b31e47e3791e23e3be51ab1', '5b31d1be92a8bd27bf5558e1', // E29N49
                            '5b170f449a5e976723b0461c', '5ae911825f179b3c3326e1ca', '5b170eb8992f3166e69ed321', '5b170a576953b80b06c3782d', '5b170a322184cc22419b1c5b', '5b16f8749a5e976723b03d2d', '5b16f8505b5e535c68bb72b2', '5b16f80c571fe2172a157e73', // E32N48 right
                            '5b16f59be0e1b65c8979112e', '5b16f5770103ca5c56d08da4', '5b16f15ef9b27d2229863560', '5b16f13a5c1367143adb7894', '5b16f103aad0b67499df66da', '5b16efaef30cc0671dc71cad', '5b16ee8dd169a83c169584a7', '5b16e6dec5612c1429ecbc15', // E32N48 right 
                            '5b16e688f0040d1440b7957f', '5b16e7036619a45c6e4c081c', '5b16eeb46619a45c6e4c0b09', '5b16efda2c9c575c5c951341', '5b16effe9bf6fe5c1aec647a', '5b16f41082c1ef67174ef5f4', '5b16f4379812cf66aaa07c85', '5b16f69f9a5e976723b03c7f', // E32N48 right
                            '5b16f6d63e372666b0e7234d', '5b1e912f9c87620c7d68d3c3', '5b16faf56a892a3c1db80f76', '5b17098aa4a4f10aff7f5cb2', '5b1709b05b5e535c68bb79a2', '5b170b2594e6d7171e9cfa2f', '5b170e4641fc6c74c4a8b60c', '5b170e3bd169a83c169590b6', // E32N48 right 
                            '5b17088754679422234fecc7', '5b17086341bb645c4a230b56', '5b1706db06b6c93bff5d7167', '5b19a157b5b4f51f708a772d', '5b24c47926aa371fc6fa57db', '5b1704ebc5612c1429ecc7f5', '5b1e930268fc1e70076891f9', // E32N48 right
                            '5b1707e39a5c993bf9b30f00', '5b1706629812cf66aaa083e0', '5b170537741ae20afad4bb2f', '5b1704c70bfae20b1810ab2c', '5b1e930268fc1e70076891f9', '5b1e92f4f9ee5338c0725b25', '5b3545aeb811fb34e2bf7bed', '5b19a10acf8031562838e8f8', 
                            '5b1701a13bc3bf222fd55268', '5b17014e4e8c62672f36d41f', '5b17012a59020b221daa4818', '5b170031da8a5f144627e713', '5b3542a644286f7b91f92b3d', '5b16ffe281157e749f30e633', '5b3369fb5eadbd443cde4802', '5b16febc94e6d7171e9cf547',
                            '5b16fea06619a45c6e4c1166', '5b16fda93365110af4a59733', '5b1e91e0c359e26f06c0383e', '5b2ca94139e5f062d3371cc4', '5b161221f2910067293c1bf0', '5b16fd5054679422234fe877', '5b16fc697ccdfa5c202fe41a', '5b24c2cbd77a365f22cc8721',
                            '5b16f9a8b69eb40b12530324', '5b16f984f9b27d2229863886', '5b16f93581157e749f30e35f', '5b16f91009027f220a43ee8d', '5b16f548e0e1b65c89791117', '5b16f2ecf30cc0671dc71dd4', '5b1609dec8820666c2eb15d1', '5b16f2c5e943b95c501004df',
                            '5b31ff4c6a23675b786de63e', '5b16ed4a2c9c575c5c951228', '5b16e5c0bed4875c26fdd558', '5b16e504c7cf271428240803', '5b2964a40dc3713be8513d02', '5b1609aa571fe2172a152259', '5b16e428571fe2172a1576c0', '5b16e404729fa022359ebf7f',
                            '5b16e3699c62da670bd43fff', '5b16e162f9e1a866b623b103', '5b16e13e94e6d7171e9cea53', '5b31fd809f6948406d988849', '5b2e50d291ecaa4e856ed3e2', '5b16e005b95b45144c8c8875', '5b16e005b95b45144c8c8875', '5b16df5c5c1367143adb71c5',
                            '5b16deeffe018d5c746feb27', '5b16decdfe018d5c746feb15',
                            '5ae8db04eaccbf11e1942f96', '5ae8cf19d0b67f3944d6698e', '5ae8d9b4d7b511312dded99b', '5ae8d9a88a126e099a6a6476', '5ae8d8d5692254390601dca4',  // E32N48 left
                            '5b1642ff3bc3bf222fd5080b', '5b0ef14b2c9c575c5c91d5bc', '5b1642732c9c575c5c94cfaa', '5b1644319a5c993bf9b2c174', '5af817dbaba2f708b745c98c', '5b19ab93e3ec353f8ab524e3', '5b19ab4b09384a778ed5ac1f', '5b19ab276c1cfa3f94e814a8', '5b19aa7473b4ea521b825806', // E32N47
                            '5b19a938dc853a59c589048d', '5b19a95d989e761f483327c1', '5b19aa0659dc711ec4602fd0', '5b19aa2b87493d563c5a7272',
                            '5b36b6eb1bd5815e311c0a22', '5b36b726ba43143024f12b29', '5b36b79bf79cb7680c96b9dd', '5b36b6568626e667ec8397d4', '5b36b61b4098ad0964e3c702', '5b36b500b1fd8267f9bd3498', // E27N48
                            '5b1ae0b837e07a562d121205', '5b1ae0949a97e81bba2b9d26', '5b1ae03509f04d5303870dcb', '5b1ae0159a97e81bba2b9cf5', '5b1add967c01ff5311fbb124', '5b24c8661c093c7ec32f55ff', '5b24c9f2e3acfd519a9f7e01', '5b24c8e97a994f52757c7863', '5b24ca1ed7d5ed51a71eabc7', // 3149
                            '5ae4e457de930e393efcf4c0', '5ae8de21d75f96326ccb50b8', '5ae8ed9299d2c03c36eef2d4', '5ae8eda98a126e099a6a6d4b', '5ae8edcbd75f96326ccb5739', '5ae8ee4bd0b67f3944d67773', '5ae8ee6d2782c509839dbcfe', '5ae8ee92c435f742aab4db65', '5ae8f0e1c435f742aab4dc85',// 37N49
                            '5ae8f135de930e393efeba94', '5ae8f203cf93c9315d284dea', '5ae8f229c34576097c1ba7ee', '5ae8f434d24b6b325f9cf826', '5ae8f44dd24b6b325f9cf832',
                            '5b1bc1be37e07a562d126d12', '5b1bc1fddc853a59c589d8fe', '5b1bc22209384a778ed67de3', //E38N49
                            '5b336f975eadbd443cde4a15', '5b24f4d57a994f52757c8b44', '5b24f9c91992d52f7e354e6b', '5b2caf4ee66b77549d54db77', '5b24f62977ac4b52a66aaa2b', '5b24f9bd1c093c7ec32f6993', '5b24f62977ac4b52a66aaa2a', '5b24f6c25a268c2015c8d833' // E31N49
                            ];
                        let target2repair = (memory_target && memory_target.hits < memory_target.hitsMax) ? memory_target :
                                          creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: object => ((object.structureType === STRUCTURE_ROAD || object.structureType === STRUCTURE_CONTAINER) && (object.hits/object.hitsMax < proc_road_repair))});
                        if (avoid_rooms && target2repair && avoid_repair.indexOf(target2repair.id) < 0) {
                            creep.memory.role = 'repair';
                            creep.memory.target_id = target2repair.id;
                        }
                        else {
                            creep.memory.role = 'transfer';
                            creep.memory.target_id = false;
                        }
                    }        
                }
                // console.log('[DEBUG][' + creep.name + ']: ROLE: ' + creep.memory.role)
                // console.log('[DEBUG][' + creep.name + '] RMT HRVST. ROLE: ' + creep.memory.role + '; TARGET: ' +  creep.memory.target_id + '; FAR target: ' + creep.memory.far_target)           
                switch(creep.memory.role) {
                    case 'withdraw':
                        let withdraw_target = Game.getObjectById(creep.memory.target_id);
                        if (creep.withdraw(withdraw_target, RESOURCE_ENERGY) !== OK) creep.moveTo(withdraw_target, global_vars.moveTo_ops);
                        else creep.memory.target_id = false;
                        break;
                    case 'harvest':
                        if (creep.carry[RESOURCE_ENERGY] === creep.carryCapacity) {
                            creep.memory.target_id = false;
                            creep.memory.role = 'undefined';
                            break;
                        }
                        
                        let remote_source = (room_name == creep.memory.far_target) ? creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE) :
                                                                                     new RoomPosition(25, 25, creep.memory.far_target);  
                        
                        // console.log('[DEBUG][' + creep.name + '] REMOUTE: ' + remote_source)
                        if (creep.harvest(remote_source) !== OK) creep.moveTo(remote_source, global_vars.moveTo_ops);
                        break;
                    case 'build':
                        // console.log('[DEBUG][' + creep.name + '] RMT HRVST. run build: ' )
                        build_action(my_room, creep);
                        break;
                    case 'repair':
                        let repair_target = Game.getObjectById(creep.memory.target_id);
                        creep_helpers.most_creep_action_results(creep, repair_target, creep.repair(repair_target), 'repair');
                        break;
                    case 'transfer':
                        // if (creep.memory.target_id) transfer_target = Game.getObjectById(creep.memory.target_id);
                        // else if (room_name === creep.memory.homeland) {
                        //     for (let l in my_room.memory.energy_flow.links.destinations) {
                        //         cur_target = Game.getObjectById(my_room.memory.energy_flow.links.destinations[l]);
                        //         if (cur_target && creep.pos.getRangeTo(cur_target) < 4)
                        //             transfer_target = cur_target;
                        //     }

                        // current_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                        // console.log('[DEBUG][' + creep.name + '] : ' +current_target)
                        // if (!current_target) {
                        
                        
                        let transfer_targets = creep.memory.source_id;
                        let current_target
                        // if (creep.name === name4log) console.log('[DEBUG][' + creep.name + ']: Room: ' + room_name + '; Homeland: ' +  creep.memory.homeland);
                        if (creep.memory.target_id) {
                            current_target = Game.getObjectById(creep.memory.target_id);   
                        } else {
                            if (room_name === creep.memory.homeland) {
                                let extension_target = (room_name === 'E28N48' && creep.memory.source_id.indexOf('5b34d0a3e6e0fa316db08a31') < 0) ? creep.pos.findClosestByPath(FIND_STRUCTURES,
                                                                                {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                                                                                                     && (object.energy < object.energyCapacity))}) : false;
                                if (extension_target) {
                                    current_target = extension_target;    
                                } else {
                                    for (let t in transfer_targets) {
                                        // if (creep.name === 'rmt_hrvst_E32N49_E31N49-1-sp') console.log('[DEBUG][' + creep.name + '] : ROOM: ' + room_name + '; target: ' + transfer_targets[t]);
                                        current_target = Game.getObjectById(transfer_targets[t])
                                        if (((current_target.structureType === 'container' && current_target.store['energy'] < current_target.storeCapacity) ||
                                            (current_target.structureType === 'link' && current_target.energy < current_target.energyCapacity)) &&
                                            (creep.pos.getRangeTo(current_target) < 20)) {
                                                // if (creep.name === 'rmt_hrvst_E37N48_E37N49-2-sp') console.log('[DEBUG](struct.creep-remote_harvest)[' + creep.name + ']: BREAK FOR target: ' + transfer_targets[t] + '; Distance: ' +  creep.pos.getRangeTo(current_target));
                                                break;
                                            }
                                    }
                                }
                            } else {
                                current_target = Game.getObjectById(transfer_targets[0]);   
                            }
                        } 
                        creep.memory.target_id = current_target.id;
                        if (creep.transfer(current_target, RESOURCE_ENERGY) !== OK) creep.moveTo(current_target, global_vars.moveTo_ops);
                        else {
                            creep.memory.target_id = false;
                        }
                        // creep.memory.target_id = current_target.id;
                        if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] TARGET: ' + current_target);
                        break;
                }
                // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Mem finish: ' + JSON.stringify(creep.memory));
                break;
            case 'mineral_miner':
                let room_mineral = Game.getObjectById(my_room.memory.energy_flow.mineral.id);
                let room_mineral_type = my_room.memory.energy_flow.mineral.type;
                // console.log('[DEBUG][' + creep.name + ']: Conditional: ' + (creep.carry[room_mineral_type] === creep.carryCapacity || room_mineral.mineralAmount === 0))
                // if (room_name === 'E36N48') console.log('[DEBUG][' + creep.name + ']: Room mineral: ' + room_mineral_type + '; Terminal: ' + JSON.stringify(my_room.terminal.store));

                if (creep.carry[room_mineral_type] === creep.carryCapacity || room_mineral.mineralAmount === 0) {
                    // let room_terminal = Game.getObjectById(my_room.memory.energy_flow.terminal);
                    // let terminal_status = _.sum(room_terminal.store)
                    // let transfer_target = (terminal_status < 250000) ? room_terminal : Game.getObjectById(my_room.memory.energy_flow.storage);
                    
                    // Terminal must created first, before storage
                    let transfer_target;
                    // if (room_name === 'E39N49') console.log('[DEBUG][' + creep.name + ']: Labs obj: ' + JSON.stringify(my_room.memory.labs.reagent))
                    let lab_id = getKeyByValue(my_room.memory.labs.reagent, room_mineral_type);
                    let my_lab = (lab_id) ? Game.getObjectById(lab_id) : false;

                    // if (room_name === 'E36N48') console.log('[DEBUG][' + creep.name + ']: Lab: ' + lab_id + '; lab store: ' + my_lab.mineralAmount + '; Room mineral: ' + room_mineral_type + '; Terminal: ' + my_room.terminal.store[room_mineral_type]);
                    
                    if (creep.memory.target_id)
                        transfer_target = Game.getObjectById(creep.memory.target_id);
                    else if (my_lab && my_lab.mineralAmount < 0.85*my_lab.mineralCapacity) 
                        transfer_target = my_lab;
                    else if ((my_room.terminal && (!my_room.terminal.store[room_mineral_type] || my_room.terminal.store[room_mineral_type] < Memory.rooms.global_vars.minerals.send_room)) ||
                        !my_room.storage) 
                            transfer_target = my_room.terminal;
                    else 
                            transfer_target = my_room.storage;
                    
                    let mineral_missing = (transfer_target.structureType === 'lab') ? (transfer_target.mineralCapacity - transfer_target.mineralAmount) :
                                                                                      creep.carry[room_mineral_type];
                    let mineral2transfer = (mineral_missing < creep.carry[room_mineral_type] ? mineral_missing : creep.carry[room_mineral_type]);
                    
                    if (creep.transfer(transfer_target, room_mineral_type, mineral2transfer) !== OK) {
                        creep.moveTo(transfer_target, global_vars.moveTo_ops);
                        // creep.memory.target_id = transfer_target.id;
                    } else 
                        creep.memory.target_id = false;
                } else {
                    // console.log('[DEBUG][' + creep.name + ']: MINERAL harvest. Type: ' + room_mineral_type + '; Target: ' + room_mineral.id + '; HARVEST: ' + creep.harvest(room_mineral))
                    if (creep.harvest(room_mineral) !== OK) creep.moveTo(room_mineral, global_vars.moveTo_ops);
                }
                break;
            case 'energy_miner':
                let target_room_obj = Game.rooms[creep.name.substring(8,14)]; // nrg_mnr_E34N47-1-sp
                // console.log('[' + creep.name + ']: Room: ' + ((Game.rooms[creep.name.substring(8,14)]) ? Game.rooms[creep.name.substring(8,14)].name : creep.name.substring(8,14))); //+ '; CNTRN: ' + target_room_obj.memory.energy_flow.containers.source);
                let source_containers = (target_room_obj.memory.energy_flow.containers.source) ?target_room_obj.memory.energy_flow.containers.source : [];
                let cntnr_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                if (!cntnr_target) {
                    for (let c in source_containers) {
                        // console.log('[' + creep.name + ']: CNTRN: ' + c + '; ' + JSON.stringify(target_room_obj.memory.energy_flow.containers.source[c]))
                        if (target_room_obj.memory.energy_flow.containers.source[c].miner_id) {
                            if (!Game.getObjectById(target_room_obj.memory.energy_flow.containers.source[c].miner_id)) {
                                cntnr_target = Game.getObjectById(c);
                                // target_room_obj.memory.energy_flow.containers.source[c].miner_id = false
                            }
                        } else {
                            cntnr_target = Game.getObjectById(c);
                            break;
                        } 
                    }
                    if (cntnr_target) {
                        creep.memory.target_id = cntnr_target.id;
                        // console.log('[' + creep.name + ']: CNTNR: ' + cntnr_target.id + '; Source: ' + JSON.stringify(target_room_obj.memory.energy_flow.containers.source))
                        target_room_obj.memory.energy_flow.containers.source[cntnr_target.id].miner_id = creep.id;
                    }
                }
                
                if(cntnr_target) {
                    if (creep.pos.x !== cntnr_target.pos.x || creep.pos.y !== cntnr_target.pos.y) creep.moveTo(cntnr_target, global_vars.moveTo_ops);
                    else if (cntnr_target.store['energy'] < cntnr_target.storeCapacity) {
                        // console.log('[' + creep.name + ']: HARVEST' + target_room_obj.memory.energy_flow.containers.source[cntnr_target.id].source_id);
                        creep.harvest(Game.getObjectById(target_room_obj.memory.energy_flow.containers.source[cntnr_target.id].source_id))
                    }
                }
                break;
            case 'upgrader':
                // let closer_link_id = creep.memory.target_id;
                // if (!closer_link_id)
                //     for (let l_dst in my_room.memory.energy_flow.links.destinations) {
                //         if (Game.getObjectById(my_room.memory.energy_flow.links.destinations[l_dst]).pos.getRangeTo(my_room.controller) < 6) {
                //             closer_link_id = my_room.memory.energy_flow.links.destinations[l_dst];
                //             creep.memory.target_id = closer_link_id;
                //             break;
                //         }
                //     }
                let withdraw_target = Game.getObjectById(my_room.memory.energy_flow.links.near_controller);
                let E32N49_container = Game.getObjectById('5b33639acb21c464f0c933a3');
                if (room_name === 'E34N47' && withdraw_target.energy === 0 && my_room.terminal.store[RESOURCE_ENERGY] > 35000) withdraw_target = my_room.terminal;
                if (room_name === 'E32N49' && E32N49_container.store.energy >= creep.carryCapacity) withdraw_target = E32N49_container;
                
                if (creep.carry[RESOURCE_ENERGY] === 0) {
                    if (creep.withdraw(withdraw_target, RESOURCE_ENERGY) !== OK) creep.moveTo(withdraw_target, global_vars.moveTo_ops);
                    // if (room_name === 'E34N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: ACT: ' + creep.withdraw(withdraw_target, RESOURCE_ENERGY))
                } else {
                    // if (room_name === 'E34N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: UPGRADE')
                    if (creep.upgradeController(my_room.controller) !== OK) creep.moveTo(my_room.controller, global_vars.moveTo_ops);
                }
                break;
            case 'its_my':
                let claim_target = new RoomPosition(42, 21, 'E28N48');
                if(creep.pos.getRangeTo(claim_target) === 1) {
                    let action_out = creep.claimController(Game.rooms['E28N48'].controller);
                    console.log('****   CLAIME: ' + action_out);
                }   
                else creep.moveTo(claim_target, global_vars.moveTo_ops);
                break;
            case 'energy_helper':
                // let source_target = Game.getObjectById('5acc524f6bec176d808adb71'); // E36N48
                let source_target;
                let cur_destination;
                
                if (!creep.memory.target_id) {
                    // if(room_name === 'E38N48' || room_name === 'E38N47') {   // help E38N48 to E38N47
                    if(room_name === 'E37N48' || room_name === 'E38N47') {   // help E38N48 to E38N47
                    // if(room_name === 'E37N48' || room_name === 'E36N48') {    // help E36N48 to E37N48
                    // if(room_name === 'E38N48' || room_name === 'E36N48') {    // help E36N48 to E38N48
                        if (creep.carry[RESOURCE_ENERGY] === 0) {
                            creep.memory.target_id = '5afd3bd34337e90a8c6d9253';    // Storage E37N48
                            // creep.memory.target_id = '5afd6ab8f686ff54854efc5a';    // Storage E38N48
                            // creep.memory.target_id = '5afd9b372c5d4f7e24b2bf4c';    // Storage E36N48
                        } else {
                            let dst_targets = ['5ae8ddbaa3702131094cfd54', '5af71eb37ee8c37d2dd9eb28', '5ae0520ca846ad0b0b3cd735', '5b11bf4882c1ef67174cd56e']; // Links and storage E38N47
                            // let dst_targets = ['5abfed40aafade1bd3be494f', '5b0c860fc8820666c2e70371', '5acc524f6bec176d808adb71']; // Links and terminal E37N48
                            // let dst_targets = ['5ac6ac8f8f27a14b942a5be4', '5ad024eac27319698ef58448']; // Links and terminal E38N48
                            for (let t in dst_targets) {
                                let cur_target = Game.getObjectById(dst_targets[t]);
                                creep.memory.target_id = dst_targets[t];
                                if (cur_target.energy < cur_target.energyCapacity) break;   // the first destination must be LINKS
                            }
                        }                    
                    }
                }
                
                if (creep.carry[RESOURCE_ENERGY] === 0) {
                    let source_target = Game.getObjectById(creep.memory.target_id);
                    let withdraw_out = creep.withdraw(source_target, RESOURCE_ENERGY);
                    if ( withdraw_out !== OK) creep.moveTo(source_target, global_vars.moveTo_op);
                    else if (withdraw_out === OK ) creep.memory.target_id = false;
                    else console.log('[DEBUG] (structCreep.run-energy_helper)[' + creep.name + ']: TRANSFER action out: ' + act_out);

                } else {
                    let cur_destination = Game.getObjectById(creep.memory.target_id);
                    let act_out = creep.transfer(cur_destination, RESOURCE_ENERGY);

                    if (act_out !== OK) creep.moveTo(cur_destination, global_vars.moveTo_op);
                    else if (act_out === OK) creep.memory.target_id = false;
                    // else console.log('[DEBUG] (structCreep.run-energy_helper)[' + creep.name + ']: TRANSFER action out: ' + act_out);
                }
                break;
            case 'harvest':
                role_harvester.run(creep, iam_general);
                break;
            case 'transfer_mineral':
                let mineral_transfer_target = (Game.getObjectById(my_room.memory.energy_flow.storage)) ? Game.getObjectById(my_room.memory.energy_flow.storage) : Game.getObjectById(my_room.memory.energy_flow.terminal);
                let minerals = Object.keys(creep.carry);
                for (let m in minerals) {
                    let act_response = creep.transfer(mineral_transfer_target, minerals[m]);
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: MINERAL: ' + minerals[m] + '; ACT out: ' + act_response)
                    creep_helpers.most_creep_action_results(creep, mineral_transfer_target, act_response, creep_role);                    
                }
                break;
            case 'transfer':
                let cur_transfer_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : transfer_target;
                if (!cur_transfer_target) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFER TARGET??? : ' + JSON.stringify(cur_transfer_target));
                
                // cur_transfer_target = Game.getObjectById('5ae2b2e96abb293c4600b189')
                
                creep.memory.target_id = cur_transfer_target.id;
                let energy_missing = cur_transfer_target.energyCapacity - cur_transfer_target.energy;
                let energy2transfer = (energy_missing < creep.carry[RESOURCE_ENERGY] ? energy_missing : creep.carry[RESOURCE_ENERGY]);
                let act_response = creep.transfer(cur_transfer_target, RESOURCE_ENERGY, energy2transfer);
                // if(room_name === 'E38N48') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Target: ' + cur_transfer_target.structureType + '; Act OUT: ' + act_response);
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
                build_action(my_room, creep);
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
                // far_target = new RoomPosition(18,10,'E38N47');
                // if(creep.withdraw(Game.getObjectById('5ad0f40c6422d62f7c492485'), RESOURCE_ENERGY) !== OK) creep.moveTo(Game.getObjectById('5ad0f40c6422d62f7c492485'), global_vars.moveTo_ops);   // go to source in new room
                // creep.moveTo(new RoomPosition(42,9,'E36N48'), global_vars.moveTo_ops);
                // creep.upgradeController(my_room.controller)
                // let new_location = Game.rooms['E36N48'].controller
                let new_location = new RoomPosition(18,10,'E28N48');
                // let new_location = Game.getObjectById('59f1a4e382100e1594f3db1a');  // controller of E28N48
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Location: ' + new_location + '; Range: ' + (creep.pos.getRangeTo(new_location) > 3)) 
                if (creep.pos.getRangeTo(new_location) > 3) creep.moveTo(new_location, global_vars.moveTo_ops)
                if (room_name === 'E28N48' && creep.pos.y < 49) {     // Need if creep came with any energy
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Change to undefined') 
                    creep.memory.role = 'undefined';
                }
                break;
            case 'attacker':
                let attacked_room = creep.memory.room_in_war;
                
                // let t = Game.getObjectById('5b36575c69d3020970a53ca7');
                // if ( creep.heal(t) !== OK) creep.moveTo(t, global_vars.moveTo_ops); 
                // t = Game.getObjectById('5b31d6a07cac973a8f2efb60');
                // if ( creep.attack(t) !== OK ) creep.moveTo(t, global_vars.moveTo_ops); 
                
                if (room_name !== attacked_room) creep.moveTo(new RoomPosition(25,25, attacked_room), global_vars.moveTo_ops);  
                else {
                    let h = my_room.find(FIND_HOSTILE_CREEPS, {filter: object => (object.owner.username !== 'Sergeev' || 
                                                                                 (object.owner.username === 'Sergeev' && creep_helpers.is_millitary(object)))})   
                    
                    let target2attack;
                    if (h.length > 1) {
                        if (h[0].body.map(x => x.type).indexOf('heal') > -1) target2attack = h[0];
                        else target2attack = h[0];
                    } else if (h.length === 1) target2attack = h[0]
                    else if (creep.hits < creep.hitsMax) {
                        creep.heal(creep);
                    } else {
                        Memory.rooms[room_name].global_vars.status = 'peace';
                        Game.notify('[INFO] (structCreep-attacker)[' + room_name + '][' + creep.name + '] We won on claimed area');
                        creep.suicide();
                    }
                    
                    if (creep.attack(target2attack) !== OK) creep.moveTo(target2attack);
                }
                if (creep.room.name === 'E38N49') creep.memory.role = 'undefined';
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
                    case 'E32N49':
                        if (creep.pos.getRangeTo(Game.getObjectById('5b11a21741bb645c4a20e159')) > 3)
                            c_id = '5b11a21741bb645c4a20e159';  // spawn
                        else {
                            creep.memory.target_id = false;
                            creep.memory.harvester_type = false;                            
                        }
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
