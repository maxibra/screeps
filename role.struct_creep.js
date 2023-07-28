const creep_helpers = require('creep_helpers');
const role_harvester = require('role.harvester');
const room_helpers = require('room_helpers');

//var global_vars = require('global_vars')();

// var spawn_name = 'max';
// var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
// var my_room = Game.rooms[global_vars.room_name];
const global_vars = Memory.rooms.global_vars;

function build_action(my_room, creep) {
    let build_target;
        // console.log('[DEBUG] (structCreep.get_full_produce_labs)[' + my_room.name + '] Targets.Build ' + JSON.stringify(my_room.memory.targets))
    if (my_room.memory.targets.build.indexOf(creep.memory.target_id) > -1) build_target = Game.getObjectById(creep.memory.target_id);
    else {
        let targets_obj = [];
        for (let i in my_room.memory.targets.build) {
            // if (my_room.memory.targets.build[i] === '5b2e4fb63d76a1365b5e098e') continue;
            targets_obj.push(Game.getObjectById(my_room.memory.targets.build[i]));
        }
        build_target = creep.pos.findClosestByRange(targets_obj);
    }

    // build_target = falseattacker
    if (build_target) {
        let action_res = creep.build(build_target);
        switch(action_res) {
            case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                my_room.memory.targets.build = [];
                creep.memory.role = false;
                creep.memory.target_id = false;
                break;
            default:
                creep_helpers.most_creep_action_results(creep, build_target, action_res, 'build');
                // creep.memory.target_id = false;
        }
    } else creep.memory.role = false;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key].type === value);
}

function get_missing_reagent_labs_id(my_room) {
    let missing_reagent_labs_id = [];
    for (let l in my_room.memory.labs.reagent) {
        let current_lab = Game.getObjectById(l);
        if (current_lab.store[current_lab.mineralType] < (current_lab.store.getCapacity(current_lab.mineralType) - Memory.rooms.global_vars.minerals.transfer_batch)) missing_reagent_labs_id.push(l);
    }
    // console.log('[DEBUG] (structCreep.get_full_produce_labs)[' + my_room.name + '] REAGENT_LABS: ' + JSON.stringify(missing_reagent_labs_id))
    return missing_reagent_labs_id;
}

function get_full_produce_labs(my_room) {
    let full_produce_labs = [];
    for (let l in my_room.memory.labs.produce) {
        let current_lab = Game.getObjectById(l);
        if (current_lab.store[current_lab.mineralType] > Memory.rooms.global_vars.minerals.transfer_batch) full_produce_labs.push(current_lab);
    }
    return full_produce_labs;
}


function transfer_mineral2boost(creep, storage, booster_lab, mineral) {
    if (booster_lab.type != mineral) {  // need to clear the lab from wrong mineral
        while (booster_lab.store[booster_lab.mineralType] > 0) {
            const total = _.sum(creep.store);
            if (total > 0) {
                if (creep.store[mineral] && creep.store[mineral]) {
                    if (creep.pos.isNearTo(storage)) {
                        creep.transfer(target, RESOURCE_ENERGY);
                    }
                }
            }
        }
    }
    // while (booster_lab.store[booster_lab.mineralType])
}

var structCreep = {
    run: function(creep, units) {
        if(creep.spawning) return;
        // role's definition
        let creep_role = creep.memory.role;
        let room_name = creep.room.name;
        let my_room = Game.rooms[room_name];
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let iam_general = (typeof creep.memory.special === "undefined");
        let log_name = '' //  'worker_E33N47_E32N47-1';
        let controller_position = Game.rooms['E39N49'].controller.pos;
        let far_source = Game.getObjectById('59f1a54882100e1594f3e357');    // far away source of E34N47
        let range2upgrade = (room_name === 'E38N47') ? 6 : 4;
        // console.log('[DEBUG] (structCreep.run)[' + room_name + ']');
        let controller_is_critical_level;
        if (!my_room.controller) controller_is_critical_level = false;
        else
            controller_is_critical_level = (Memory.rooms[room_name].global_vars.status === 'peace') ?
                (my_room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[my_room.controller.level]*0.75) :
                (my_room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[my_room.controller.level]*0.25);

        let fill_terminal = (my_room.terminal &&
                             my_room.terminal.store.getFreeCapacity() > 5000 &&
                              my_room.terminal.store[RESOURCE_ENERGY] < my_room.memory.energy_flow.max_store.terminal_energy);
        let my_room_storage_max_energy = 0;
        // let my_storage_max_energy = (my_room.memory.global_vars.storage_max_energy) ? my_room.memory.global_vars.storage_max_energy : my_room_storage_max_energy;
        let my_storage_max_energy = my_room_storage_max_energy;
        // if (room_name === 'E38N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Terminal Store: ' + my_room.terminal.store[RESOURCE_ENERGY] + '; MAX: ' + Memory.rooms.global_vars.terminal_max_energy_storage+ '; USED: ' + my_room.memory.energy_flow.store_used.terminal + '; MAX: ' + my_room.memory.energy_flow.max_store.terminal);

       // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] ROOM: ' + room_name)

        // It's nothing todo
        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] unemployed role: ' + creep.memory.role + '; full: ' + my_room.memory.global_vars.all_full + 'store_used.terminal: ' + my_room.memory.energy_flow.store_used.terminal + '; max_store.terminal: ' + my_room.memory.energy_flow.max_store.terminal);

        // *** UNIT LOG
        if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Start Creep mem: ' + JSON.stringify(creep.memory, null, 2));
        // ********

        // if (creep.name === 'E39N49-1-gn') {
        //     if (_.sum(creep.store) === 0) {
        //         cur_lab = Game.getObjectById('5c6325d69be3044576f0b9c8')
        //         if (creep.pickup(cur_lab) == ERR_NOT_IN_RANGE) {
        //         // if (creep.withdraw(cur_lab, RESOURCE_ZYNTHIUM_KEANITE) == ERR_NOT_IN_RANGE) {
        //             creep.moveTo(cur_lab);
        //         }
        //     } else {
        //         if (creep.transfer(my_room.storage, RESOURCE_ZYNTHIUM_KEANITE) == ERR_NOT_IN_RANGE) {
        //             creep.moveTo(my_room.storage);
        //         }
        //     }
        //     return
        // }

        // if (my_room.terminal && my_room.memory.global_vars && my_room.memory.global_vars.all_full &&
        //     !creep.memory.role &&
        //     // units[room_name]['upgrader'] > 0 && (Game.time % 20) !== 0 &&
        //     (my_room.memory.energy_flow.store_used.terminal > my_room.memory.energy_flow.max_store.terminal ||
        //      my_room.terminal.store[RESOURCE_ENERGY] > Memory.rooms.global_vars.terminal_max_energy_storage)) {
        //         console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Im unemployed');
        //         return;
        // }

        // if(creep.name.slice(-2) === "gn" && creep.store['energy'] === 0 && creep.ticksToLive < 20) {
        //     console.log('[DEBUG] (structCreep.run)[' + creep.name + '] A few live to do something. Suicide')
        //     creep.suicide();
        //     return;
        // }
        // creep.memory.role = false
        let condition2change_role = (iam_general && my_room.memory.global_vars &&
                                      ((creep.memory.role === 'harvest' && creep.store.getUsedCapacity([RESOURCE_ENERGY]) == creep.store.getCapacity()) ||
                                      !creep.memory.role  // ||
                                    //   (creep.memory.target_id === my_room.controller.id &&
                                    //     (my_room.energyAvailable < (my_room.energyCapacityAvailable*0.85)))
                                      ));
        if (creep.name === log_name) {
            console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Condition to change role: ' + condition2change_role + '; Not role: ' +!creep.memory.role + '; Role: ' + creep.memory.role)
            console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Target is controller: ' + (creep.memory.target_id === my_room.controller.id) + '; Capacity: ' + (creep.store.getUsedCapacity([RESOURCE_ENERGY]) == creep.store.getCapacity()) + '; Fill terminal: ' + fill_terminal);
            console.log('[DEBUG] (structCreep.run)[' + creep.name + '] ticks to downgrade: ' + (my_room.controller.ticksToDowngrade > 120000 || my_room.controller.ticksToDowngrade > 180000))
        }

        if (condition2change_role) {
            // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] (Cond2Cahnge) target_id is Changed to false');
            creep.memory.target_id = false;
        }
        // if (creep.name === 'E28N48-2-gn') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] creep.store.getCapacity([RESOURCE_ENERGY]): ' + creep.store.getCapacity([RESOURCE_ENERGY]) + '; creep.store.getCapacity: ' + creep.store.getCapacity() +  '; condition2change_role: ' + condition2change_role +'; creep.memory: ' + JSON.stringify(creep.memory))
        // *** LOG
        // if (creep.name === log_name)
        // if (room_name === 'E38N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Time: ' + Game.time + '; Controller: ' + JSON.stringify(controller_position) + '; Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        // ********

        var transfer_target = false;
        var source_away = false;

        // Game.spawns['max'].spawnCreep([MOVE,MOVE,MOVE,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH], 'claimer1', {'role': 'claimer'})
        if (creep.memory.special) {
            // Jump directly to Actions
            creep_role = creep.memory.special
        } else if (creep.name === 'its_my') {
            creep_role = 'its_my';
        } else if (Object.keys(creep.store).length > 1) {
            creep_role = 'transfer_mineral';
        } else if (creep.name.substring(0,6) === 'worker' && creep.pos.getRangeTo(new RoomPosition(25, 25, creep.name.substring(14,20))) > 24) {
            creep_role = 'worker';
        } else if (creep.name.substring(0,1) === 'E' && creep.name.substring(0,6) !== room_name) { // Go back back from wrong room
            console.log('[DEBUG] (' + room_name + ']: ' + creep.name.substring(0,6));
            creep.moveTo(Game.rooms[creep.name.substring(0,6)].controller, global_vars.moveTo_ops);
            return;
        } else if(creep.store.energy === 0) { //} || creep.memory.role === 'harvest') {
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Go harvets');
            creep_role = 'harvest';
        } else if (!creep.memory.target_id &&
                    controller_is_critical_level) {
            if (creep.memory.role !== 'upgrade') creep.say('upgrading');
            creep_role = 'upgrade';
            units[room_name]['upgrade']++;
        } else if (condition2change_role) {
            var current_workers = units[room_name]['total'] - units[room_name]['harvest'];
            var current_creep_types = room_vars.creep_types[room_vars.status];
            //TODO: Improve location of tower. don't search per creep
            let transfer_procent = units[room_name]['transfer']/current_workers;
            let extensions_first = my_room.memory.energy_flow.extension_first;

            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Extension first: ' + extensions_first)
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: BUILD structures: ' + (my_room.memory.targets.build.length)) // && units[room_name]['build']/current_workers < current_creep_types.build));

            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfers: ' + transfer_procent +' / ' + current_creep_types.transfer);
            // ********

            // Try to transfer to links first
            // let range2link = 6;
            // if (room_name === 'E27N48') range2link = 3;
            let range2link = 4;

            // let link_sources = (my_room.memory.energy_flow.links.near_sources) ? my_room.memory.energy_flow.links.near_sources : [];
            // link_sources = link_sources.concat(my_room.memory.energy_flow.links.sources);
            let link_sources = my_room.memory.energy_flow.links.near_sources.concat(my_room.memory.energy_flow.links.sources);

            if (room_name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] LINKS: ' + link_sources + '; ENgry_FLow: ' + JSON.stringify(my_room.memory.energy_flow.links));

            for (let l in link_sources) { // try transfer to link
                cur_transfer_target = Game.getObjectById(link_sources[l]);
                if (room_name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Upgrds: ' + Memory.rooms.global_vars.units[room_name].upgrader);
                if (cur_transfer_target &&
                    Memory.rooms[room_name].global_vars.status === 'peace' && !extensions_first &&
                    ((cur_transfer_target.store[RESOURCE_ENERGY]/cur_transfer_target.store.getCapacity(RESOURCE_ENERGY) < 0.7) && (creep.pos.getRangeTo(cur_transfer_target) < range2link) ||
                    (creep.pos.isNearTo(cur_transfer_target) && cur_transfer_target.store[RESOURCE_ENERGY] < cur_transfer_target.store.getCapacity(RESOURCE_ENERGY)))) {
                    if (room_name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Transfer to Link: ' + cur_transfer_target)
                    transfer_target =  cur_transfer_target;
                    break;
                }
            }

            if (creep.name === 'worker_E29N47_E28N47-1') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS target: ' + transfer_target + '; extensions_first: ' + extensions_first);
            if (!transfer_target && !extensions_first) {
                transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER &&
                                                                                                      object.store[RESOURCE_ENERGY]/object.store.getCapacity(RESOURCE_ENERGY) < (Memory.rooms.global_vars.min_tower_enrg2repair+0.1) &&
                                                                                                      !my_room.memory.towers.current[object.id])});
                if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS target TOWER: ' + transfer_target);
            }

            // let current_body_cost = (my_room.energyCapacityAvailable < my_room.memory.global_vars.max_body_cost) ? my_room.energyCapacityAvailable : my_room.memory.global_vars.max_body_cost;
            // let room_enegry_is_good = (my_room.energyAvailable >= (my_room.energyCapacityAvailable * 0.6) && my_room.energyAvailable >= current_body_cost);
            // *** UNIT LOG
            // ********
            // if (room_name === 'E34N47' && creep.pos.isNearTo(far_source)) {
            //     transfer_target = Game.getObjectById('5ad1a3171db6bf2fc4648b26');   // ID of far link in the room E34N47
            //     creep_role = 'transfer';
            // } else

            // // ************ Start prefer BUILD
            // if (room_name === 'E36N48') {//&&
            //   // my_room.memory.targets.build && units[room_name]['build']/current_workers <= current_creep_types.build) {
            //         creep.say('building');
            //         console.log('[DEBUG][' + creep.name + '] Try run to build: ' )
            //         creep_role = 'build';
            //         units[room_name].build++; }
            // else
            // // ************ finish prefer BUILD

            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Room_name: REPAIR Condition: ' + (my_room.controller.level < 8 && my_room.memory.targets.creep_repair_defence && units[room_name]['repair_defence']/current_workers <= current_creep_types.repair_defence))
            if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] room: ' + my_room.name + '; REPAIR Condition: ' + my_room.memory.targets.creep_repair_defence)

            if (transfer_target && !my_room.memory.towers.current[transfer_target.id]) { // && room_enegry_is_good
                // *** LOG
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target TOWER: ' + JSON.stringify(transfer_target));
                creep.say('transfering');
                creep_role = 'transfer';
                if (transfer_target.structureType === 'tower' ) my_room.memory.towers.current[transfer_target.id] = creep.name;
            } else {
                // if (room_name === 'E38N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target LINK: ' + JSON.stringify(transfer_target));
                if (!(transfer_target)) { // transfer to extensions or spawn // && room_enegry_is_good
                    transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                        && (object.store[RESOURCE_ENERGY] < object.store.getCapacity(RESOURCE_ENERGY)))});
                }

                // if (room_name === 'E38N47' && transfer_target) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target (EXTENSIONS?): ' + transfer_target.structureType + '; ID: ' + transfer_target.id + '; transfer_procent: ' + transfer_procent + '; condition: ' + (transfer_target && (transfer_procent <= current_creep_types.transfer)));
                let booster_lab_id = (my_room.memory.labs) ? Object.keys(my_room.memory.labs.booster)[0] : false;
                if (!extensions_first && !transfer_target && booster_lab_id) {
                    let booster_lab = Game.getObjectById(booster_lab_id);
                    // if (room_name === 'E29N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Booster lab (fill energy?): ' + booster_lab);
                    if (booster_lab && booster_lab.store[RESOURCE_ENERGY] < booster_lab.store.getCapacity(RESOURCE_ENERGY)) transfer_target = booster_lab;
                }

                if (!transfer_target) { // transfer to NUKER
                    transfer_target = my_room.find(FIND_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_NUKER)
                        && (object.store[RESOURCE_ENERGY] < object.store.getCapacity(RESOURCE_ENERGY)))})[0];
                }

                // *** LOG
                if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target: ' + JSON.stringify(transfer_target));
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Terminal cond: ' + (my_room.memory.global_vars.all_full))
                // if (creep.name === log_name) console.log('[DEBUG][' + creep.name + '] BUILD condition. my_room.memory.targets.build:' + my_room.memory.targets.build + 'units[room_name][build]: ' + (units[room_name]['build']/current_workers) + 'current_creep_types.build: ' + current_creep_types.build);
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Defence Tar: ' + my_room.memory.targets.repair_defence +'; Repaire_DEFENCE: ' + current_creep_types.repair_defence);
                // if (creep.name === 'E29N47-1-gn') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Storage Condition: ' + ((my_room.controller.level === 8 || units[room_name]['upgrader'] > 0) &&
                //                                                                                                                   my_room.memory.energy_flow.storage &&
                //                                                                                                                     //   my_room.memory.global_vars.all_full &&
                //                                                                                                                   my_room.storage.store.getUsedCapacity('energy') < my_storage_max_energy &&
                //                                                                                                                   my_room.memory.energy_flow.store_used.storage < my_room.memory.energy_flow.max_store.storage))

                if(transfer_target && (extensions_first || transfer_procent <= current_creep_types.transfer)) {
                    creep.say('transfering');
                    creep_role = 'transfer';

                    // *** UNIT LOG
                    // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                    // ********

                    //units[room_name].transfer++;
                } else if (my_room.controller.level < 9 && my_room.memory.targets.repair_civilian && units[room_name]['repair_civilian']/current_workers <= current_creep_types.repair_civilian) {  // TODO: change 9 to 7
                    creep.say('civilian repair');
                    creep_role = 'repair_civilian';
                    units[room_name].repair_civilian++;
                } else if ((typeof my_room.memory.targets.build === 'object' && Object.entries(my_room.memory.targets.build).length > 0) &&
                            units[room_name]['build']/current_workers <= current_creep_types.build) {
                    creep.say('building');
                    console.log('[DEBUG][' + creep.name + '] Try run to build: ' );
                    creep_role = 'build';
                    units[room_name].build++;
                } else if (Memory.rooms[room_name].global_vars.status ==='war' &&
                           my_room.memory.targets.creep_repair_defence.length > 0 && units[room_name]['repair_defence']/current_workers <= current_creep_types.repair_defence) {

                    // *** GLOBAL LOG
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Changed ' + creep.memory.role + ' to repair_defence: ' + units[room_name]['repair_defence'] + ' / ' + current_workers + '=' + units[room_name]['repair_defence']/current_workers + '[' + current_creep_types.repair_defence +']' + '; Creep_repair_defence: ' + my_room.memory.targets.creep_repair_defence);
                    // ********

                    creep.say('defence repair');
                    creep_role = 'repair_defence';
                    //units[room_name].repair_defence++;
                    // Return here repair
                } else if (my_room.controller.level === 8 &&
                           controller_is_critical_level) { //  && creep.body.map(x=>x.type).indexOf('work') > -1) {
                    creep.say('low_controller');
                    creep_role = 'upgrade';
                } else if (fill_terminal && creep.memory.energy_source != "terminal" && creep.memory.energy_source != "storage") {
                    creep.say('to_terminal');
                    creep_role = 'transfer';
                    transfer_target = my_room.terminal;
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFER to terminal: ' + transfer_target);
                } else if (
                           my_room.memory.energy_flow.storage &&
                           my_room.memory.energy_flow.store_used.storage < my_room.memory.energy_flow.max_store.storage &&
                           my_room.storage.store['energy'] < my_room.memory.energy_flow.max_store.storage_energy &&
                           creep.memory.energy_source != "terminal" && creep.memory.energy_source != "storage") {
                    creep.say('to_storage');
                    creep_role = 'transfer';
                    transfer_target = Game.getObjectById(my_room.memory.energy_flow.storage);
                } else if (!controller_is_critical_level && my_room.memory.targets.creep_repair_defence.length > 0) { // && Memory.rooms.global_vars.disable_repearing_by_towers) {
                    creep.say('1-defence repair');
                    creep_role = 'repair_defence';
                } else if (my_room.memory.global_vars.all_full){ // if (room_name !== 'E39N49') {
                    creep.say('1-upgrading');
                    creep_role = 'upgrade';
                }
                else {
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Creep role = false. unemployed. Stuck counter: ' + my_room.memory.energy_flow.from_terminal_stuck)
                    creep_role = false;

                    if (my_room.memory.energy_flow.from_terminal_stuck > 9) {
                        creep.memory.energy_source = false
                        my_room.memory.energy_flow.from_terminal_stuck = 0
                    } else
                        my_room.memory.energy_flow.from_terminal_stuck += 1
                }
                // else {
                //     creep.say("I'm LAB_ASSISTENT");
                //     creep_role = 'lab_assistent';
                // }
                // }
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: CHANGED ROLE: ' + JSON.stringify(creep.memory));
                // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] (ELSE) target_id is Changed to false');
                creep.memory.target_id = false;
            }
        }

        // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] Role: ' + creep_role + '; Memory: ' + creep.memory.role)
        if(!creep.memory.special) {
            creep.memory.role = creep_role
        }
        // Action per role
        // let creep_role = (creep.memory.special) ? creep.memory.special : creep.memory.role;

        // *** UNIT LOG
        if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Creep role: ' + creep_role);
        // ********

        switch(creep_role) {
            case 'guard':
                let target2attack = false;
                let hostile2attack = false;
                if (my_room.memory.hostile2attack) {
                    hostile2attack = Game.getObjectById(my_room.memory.hostile2attack);
                    // console.log('[DEBUG] (structCreep-guard)('+ creep.name + ') Hostile2Attack by getObject:' + ((hostile2attack)?hostile2attack.id:'NA'))
                }

                let my_post = new RoomPosition(creep.memory.post[0], creep.memory.post[1], creep.memory.post[2]);
                if (!(room_name === my_post.roomName && creep.pos.x < 47) ) {
                    creep.moveTo(my_post, global_vars.moveTo_ops);
                    return;
                }

                // creep.moveTo(my_post); return;
                // target2attack = Game.getObjectById('5ba082b39b6fbc04b99a7868');
                // if ( creep.rangedAttack(target2attack) !== OK) {
                //     creep.moveTo(target2attack);
                //     return;
                // }

                let milittary_hostile = [];
                if (!hostile2attack && (Game.time % 3) === 0) {
                    let h = my_room.find(FIND_HOSTILE_CREEPS);
                    // console.log('[DEBUG] (structCreep-guard)('+ creep.name + ') Searching target to ATTACk')
                    for (let i in h) {
                        if ((h[i].pos.x > 50) && h[i].pos.y > 50) continue;
                        for (let t in h[i].body) {
                            if (h[i].body[t].type === 'heal' || h[i].body[t].type === 'ranged_attack' || h[i].body[t].type === 'attack') {
                                milittary_hostile.push(h[i]);
                                break;
                            }
                        }
                    }
                }

                target2attack = (hostile2attack) ? hostile2attack : creep.pos.findClosestByRange(milittary_hostile);
                // console.log('[DEBUG] (structCreep-guard)('+ creep.name + ') target to attack : ' + target2attack);

                if (target2attack) {
                    my_room.memory.hostile2attack = target2attack.id;
                    let range2attack = creep.pos.getRangeTo(target2attack);
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] range to: ' + range2attack + '; X: ' + target2attack.pos.x)

                    if (range2attack > 3) creep.moveTo(target2attack);
                    else if (range2attack > 1) creep.rangedAttack(target2attack);
                    else
                    (creep.attack(target2attack) || creep.rangedAttack(target2attack));
                } else {
                    my_room.memory.hostile2attack = false;
                    // console.log('[DEBUG] (structCreep-guard)('+ creep.name + ') Hostile2Attack to false becase of target2attack: ' + JSON.stringify(target2attack))
                    if (creep.hits < creep.hitsMax) creep.heal(creep);
                    if (!creep.pos.isNearTo(my_post)) creep.moveTo(my_post);
                }

                break;
            case 'lab_assistent':
                // Game.creeps['lab_assistent_E39N49-1-sp'].transfer(Game.getObjectById('5afff958ff9d380d22e3634a'), 'K')
                // Game.creeps['lab_assistent_E39N49-1-sp'].transfer(Game.getObjectById('5ac6205ba6cd8147a71e01d5'), 'K')
                // creep.memory.target_id = false;
                // break
                let log_if_room = 'E34N47';

                // if (room_name == log_if_room) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] LAB_Assistent_Needed: ' + my_room.memory.global_vars.screeps_max_amount.lab_assistent_needed)

                if (creep.ticksToLive < 36 && creep.store.getUsedCapacity() === 0) {
                    creep.suicide();
                    return;
                }

                if (creep.memory.target_id) {
                    target_object = Game.getObjectById(creep.memory.target_id);
                    // if (room_name == log_if_room) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] TARGET ID : ' + creep.memory.target_id + '; MINERAL: ' + creep.memory.mineral2withdraw)
                    if (creep.pos.isNearTo(target_object)) {
                        mineral = _.remove(Object.keys(creep.store), function(mineral_type) { return mineral_type != "energy"; })[0];
                        if (mineral) {
                            creep.transfer(target_object, mineral);
                            creep.memory.mineral2withdraw = false
                        }
                        else creep.withdraw(target_object, creep.memory.mineral2withdraw, creep.memory.mineral_amount);
                        creep.memory.target_id = false
                    } else creep.moveTo(target_object, global_vars.moveTo_ops);
                } else {    // target_id doesn't defined
                    const total = _.sum(creep.store);
                    if (total == 0) {   // The creep is empty
                        if (creep.ticksToLive < 30 ||
                            (!my_room.memory.global_vars.screeps_max_amount.lab_assistent_needed &&
                             my_room.memory.labs.reagent_labs_full)) {   // to Preserve losing minerals on the way
                            creep.suicide();
                            return
                        }

                        // if (room_name == log_if_room) {
                        //     creep.memory.target_id = '5adea2c316b2ab2a2a2b472f'
                        //     creep.memory.mineral_amount = 117
                        //     creep.memory.mineral2withdraw = 'GHO2'
                        //     return
                        // }
                        // else if (room_name == 'E34N47') {
                        //     creep.memory.target_id = '5afd5ccf837d9a0a7a7ba8e9'
                        //     // creep.memory.mineral_amount = 219
                        //     creep.memory.mineral2withdraw = 'GO'
                        //     return
                        // }


                        // my_room.find(FIND_TOMBSTONES).forEach(tombstone => {
                        //     if(tombstone.creep.my){
                        //
                        //     }
                        // }
                        // Create object of good sources to withdraw {<id>: <mineral>,...}
                        sources2withdraw = room_helpers.create_sources2withdraw(room_name, creep.store.getCapacity());
                        if (room_name == log_if_room)  console.log('[DEBUG] (structCreep.run)[' + creep.name + '] SOURCES: ' + JSON.stringify(sources2withdraw));


                        // // Code to drain all labs
                        // let all_not_empty_labs = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LAB &&
                        //                                         object.mineralType &&
                        //                                         (object.store.getUsedCapacity(object.mineralType) > 0))});
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] All LABs: ' + all_not_empty_labs.length)
                        // if (all_not_empty_labs.length > 0) {
                        //         let current_lab = all_not_empty_labs[0]
                        //         // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] LAB: ' + current_lab)
                        //         creep.memory.target_id = current_lab.id
                        //         creep.memory.mineral2withdraw = current_lab.mineralType
                        // }
                        // // END OF Code to drain all labs


                        lab2withdraw = room_helpers.get_lab2withdraw(room_name);
                        sources2withdraw[lab2withdraw[0]] = [lab2withdraw[1], creep.store.getCapacity()];
                        sources_array = [];
                        for (l_id in sources2withdraw) sources_array.push(Game.getObjectById(l_id));
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] SOURCES: ' + JSON.stringify(sources_array.length))

                        let closest_target2withdraw = creep.pos.findClosestByRange(sources_array);
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] CLOSEST ID: ' + closest_target2withdraw)
                        if (closest_target2withdraw) {
                            creep.memory.target_id = closest_target2withdraw.id;
                            creep.memory.mineral2withdraw = sources2withdraw[closest_target2withdraw.id][0];
                            // following is right because of creep is totally empty here (total =0)
                            if (room_name == log_if_room) console.log('[DEBUG] (' + creep.name + ') Witdraw Mineral ' + sources2withdraw[closest_target2withdraw.id][0] +
                                                                                          '; Lab Free space: ' + sources2withdraw[closest_target2withdraw.id][1]);
                            creep.memory.mineral_amount = (sources2withdraw[closest_target2withdraw.id][1] < creep.store.getCapacity()) ?
                                                                            sources2withdraw[closest_target2withdraw.id][1] :
                                                                            creep.store.getCapacity()
                        } else if (my_room.memory.lab_per_mineral[my_room.memory.energy_flow.mineral.type] && Game.getObjectById(my_room.memory.energy_flow.mineral.id).ticksToRegeneration > 100) {
                            lab_of_mineral = Game.getObjectById(my_room.memory.lab_per_mineral[my_room.memory.energy_flow.mineral.type]);
                            console.log('[DEBUG] (structCreep.run)[' + creep.name);
                            free_space = lab_of_mineral.store.getCapacity(lab_of_mineral.mineralType) - lab_of_mineral.store[lab_of_mineral.mineralType];
                            // if (free_space > 250) {
                            if (free_space > 0) {
                                creep.memory.target_id = my_room.storage.id;
                                creep.memory.mineral2withdraw = my_room.memory.energy_flow.mineral.type;
                                // following is right because of creep is totally empty here (total =0)
                                creep.memory.mineral_amount = (free_space < creep.store.getCapacity()) ? free_space : creep.store.getCapacity()
                            }
                        }
                        // if (room_name == 'E38N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Target ID: ' + creep.memory.target_id + '; Minersl: ' + my_room.memory.energy_flow.mineral.type)

                        // Go to Terminal to withdraw Ghodium to FILL NUKER
                        if (!creep.memory.target_id ) {  // It's no target was found
                            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']')
                            room_nuker = my_room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_NUKER } })[0];
                            if (room_nuker && my_room.terminal.store['G'] >= 200 && room_nuker.ghodium <= 4800) {
                                creep.memory.target_id = my_room.terminal.id;
                                creep.memory.mineral2withdraw = "G"
                            }
                        }

                        // Transfer final processed mineral from terminal to storage
                        if (!creep.memory.target_id && my_room.terminal) {  // It's still no target was found
                            final_procedure_minerals = Memory.rooms.global_vars.room_by_mineral.final_produce;
                            random_mineral = final_procedure_minerals[Math.floor(Math.random()*final_procedure_minerals.length)];
                            // console.log('[DEBUG] (' + creep.name + ') Random mineral: ' + random_mineral + '; Storage: ' + my_room.storage.store[random_mineral])
                            if (my_room.storage.store[random_mineral] < Memory.rooms.global_vars.minerals.storage_final_produce ||
                                !my_room.storage.store[random_mineral]) {
                                creep.memory.target_id = my_room.terminal.id;
                                creep.memory.mineral2withdraw = random_mineral
                            }
                        }

                        // Transfer room's mineral from storage to terminal
                        if (!creep.memory.target_id && my_room.terminal) {  // It's still no target was found
                            if (my_room.terminal.store[my_room.memory.energy_flow.mineral.type] < Memory.rooms.global_vars.minerals.send_room) {
                                console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Go To STORAGE to transfer ' + my_room.memory.energy_flow.mineral.type);
                                creep.memory.target_id = my_room.storage.id;
                                creep.memory.mineral2withdraw = my_room.memory.energy_flow.mineral.type
                            }
                        }
                    } else  {   // The creep isn't empty
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] LAB ID : ' + room_helpers.get_lab_by_mineral(room_name, creep.memory.mineral2withdraw))

                        if (creep.pos.isNearTo(my_room.terminal)) {
                            room_nuker = my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_NUKER}})[0];
                            if (creep.memory.mineral2withdraw == 'G' && room_nuker.ghodium <= 4800)
                                creep.memory.target_id = my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_NUKER}})[0].id;
                            else if (Memory.rooms.global_vars.room_by_mineral.final_produce.includes(creep.memory.mineral2withdraw))
                                creep.memory.target_id = my_room.storage.id;
                            else
                                creep.memory.target_id = my_room.memory.lab_per_mineral[creep.memory.mineral2withdraw]
                        } else
                            creep.memory.target_id = my_room.terminal.id

                        // if (room_name == log_if_room) creep.memory.target_id = '5b3a8e4d008bbf77da394b74'
                        // else if (room_name == 'E34N47') creep.memory.target_id = '5adea2c316b2ab2a2a2b472f'

                        // // Define target drain labs to terminal
                        // creep.memory.target_id = my_room.terminal.id
                        // creep.memory.mineral2withdraw = creep.memory.mineral2withdraw
                    }
                }
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] AFTER Target ID : ' + creep.memory.target_id + '; MINERAL: ' + creep.memory.mineral2withdraw)
                break;
            case 'energy_shuttle':
                let creep_action;
                source_container = Game.getObjectById(Object.keys(my_room.memory.energy_flow.containers.source)[0]);
                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Shuttle energy: ' + creep.store['energy'] + '; Container: ' + source_container.store['energy']);
                let target2transfer = false;

                if (Game.time % 5 > 0) break;

                target2transfer = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => ((object.structureType === STRUCTURE_TOWER ||
                                                                                     object.structureType === STRUCTURE_EXTENSION ||
                                                                                     object.structureType === STRUCTURE_SPAWN) &&
                                                                                    (object.store[RESOURCE_ENERGY]/object.store.getCapacity(RESOURCE_ENERGY) < 0.9))});
                if (creep.store['energy'] === 0 && target2transfer && source_container.store['energy'] > creep.store.getCapacity()) creep_action = 'withdraw';
                else if (creep.store['energy'] === 0) {
                    if (source_container.store['energy'] > 500) creep_action = 'withdraw';
                    else creep_action = 'go_close';
                } else if (creep.store['energy'] > 0 && target2transfer) {
                    creep_action = 'transfer';
                } else {
                    target2transfer = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LINK &&
                                                                                                          object.store[RESOURCE_ENERGY]/object.store.getCapacity(RESOURCE_ENERGY) < 0.8)});
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
                        let energy_missing = target2transfer.store.getCapacity(RESOURCE_ENERGY) - target2transfer.store[RESOURCE_ENERGY];
                        let energy2transfer = (energy_missing < creep.store[RESOURCE_ENERGY] ? energy_missing : creep.store[RESOURCE_ENERGY]);
                        let act_response = creep.transfer(target2transfer, RESOURCE_ENERGY, energy2transfer);
                        creep_helpers.most_creep_action_results(creep, target2transfer, act_response, creep_role);
                        break;
                }
                break;
            case 'mineral_shuttle':
                let my_room_mineral_type = my_room.memory.energy_flow.mineral.type;
                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Type: ' + my_room_mineral_type + '; Carry: ' + JSON.stringify(creep.store) + '; Terminal: ' + my_room.terminal.store[my_room_mineral_type] );
                if ((!creep.store[my_room_mineral_type] || creep.store[my_room_mineral_type] === 0) &&
                    my_room.terminal.store[my_room_mineral_type] < Memory.rooms.global_vars.minerals.send_room &&
                    creep.withdraw(my_room.storage, my_room.memory.energy_flow.mineral.type) !== 'OK')
                        creep.moveTo(my_room.storage,  global_vars.moveTo_ops);

                break;
            case 're_transfer':
                let transfer_type = 'O';
                // let memory_reagents = Game.rooms['E39N49'].memory.labs.reagent;
                // let lab = Game.getObjectById((Object.keys(memory_reagents).find(key => memory_reagents[key].type === transfer_type)))
                // let src_target = my_room.terminal;
                // let dst_target = (lab.store[lab.mineralType] < 0.8 * lab.store.getCapacity(lab.mineralType)) ? lab : my_room.storage;
                // let dst_target = (lab.store[lab.mineralType] < 0.8 * lab.store.getCapacity(lab.mineralType)) ? lab : my_room.storage;

                let src_target = my_room.terminal;
                let dst_target = my_room.storage;
                // let src_target = my_room.storage;
                // let dst_target = my_room.terminal;

                let carry_total = _.sum(creep.store);
                let creep_carries = Object.keys(creep.store);
                if (carry_total === 0) {
                    let current_resource = transfer_type;
                    // if (dst_target.store[current_resource] > 34000) break;
                    if (src_target.store[current_resource] < 40500) break;
                    // if (src_target.store[current_resource] <= 0) break;
                    // let current_resource = transfer_type;

                    // for (let r in src_target.store)
                    //     if (r !== 'energy')  // src_target.store[r] > 40000)
                    //         current_resource = r;
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: SRCs: ' + JSON.stringify(src_target.store) + '; SRC: ' + current_resource);
                    // if (src_target.store['Z'] > 30000 && creep.withdraw(src_target, current_resource) !== OK) creep.moveTo(src_target, global_vars.moveTo_ops);
                    // if (creep.pickup(src_target) !== OK) creep.moveTo(src_target, global_vars.moveTo_ops);
                    if (creep.withdraw(src_target, current_resource) !== OK) creep.moveTo(src_target, global_vars.moveTo_ops);
                } else {
                    for (let c in creep_carries)
                        if (creep.transfer(dst_target, creep_carries[c])) creep.moveTo(dst_target, global_vars.moveTo_ops);
                }
                break;
            case 'remote_energy_miner':
                if (!Memory.rooms[creep.memory.far_target] || !Memory.rooms[creep.memory.far_target].energy_flow) return;
                // console.log('[DEBUG] (structCreep.run-remote_energy_miner)[' + creep.name + ']: Far Target: ' +  creep.memory.far_target)
                let room_containers_id = Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.source);
                let first_container_id = room_containers_id[0];
                let rmt_container_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) :
                                                                      Game.getObjectById(first_container_id);
                if (!rmt_container_target) rmt_container_target = new RoomPosition(25,25, creep.memory.far_target);
                // console.log('[DEBUG] (structCreep.run - Remote enrgy miner)(remote_claimer) [' + creep.name + ']: Far Target: ' +  creep.memory.far_target + '; Containers: ' + JSON.stringify(room_containers_id) + '; Remote Target: ' + rmt_container_target + '; Range to target: ' + creep.pos.getRangeTo(rmt_container_target));

                if (creep.memory.stuck > 6) {
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


                if (!rmt_container_target) {
                    console.log('[ERROR] (structCreep.run-remote_energy_miner)[' + creep.name + ']: No mine is defined: ' + JSON.stringify(creep.memory.far_target));
                    break;
                } else {
                    creep.memory.target_id = first_container_id;
                }

                // console.log('[ERROR] (structCreep.run-remote_energy_miner)[' + creep.name + ']: Container: ' + rmt_container_target);
                if (creep.pos.getRangeTo(rmt_container_target) > 0 && creep.pos.getRangeTo(rmt_container_target) < 3) creep.memory.stuck += 1;

                // console.log('[DEBUG] (structCreep.run - Remote enrgy miner)(remote_claimer) [' + creep.name + ']: Target: ' + rmt_container_target.id + '; Range to target: ' + creep.pos.getRangeTo(rmt_container_target));
                if (creep.pos.getRangeTo(rmt_container_target) > 0) creep.moveTo(rmt_container_target, global_vars.moveTo_ops);
                else if (rmt_container_target.id && rmt_container_target.store[RESOURCE_ENERGY] < rmt_container_target.store.getCapacity()) {
                    // let current_source =
                    let act_out = creep.harvest(Game.getObjectById(Memory.rooms[creep.memory.far_target].energy_flow.containers.source[rmt_container_target.id].source_id))
                    // if (act_out !== OK) creep.memory.stuck
                }
                creep.memory.target_id = (rmt_container_target) ? rmt_container_target.id : false;
                break;
            case 'remote_claimer':
                let newRoomPosition = '';
                if (room_name === 'E32N53' || creep.memory.far_target === 'E28N47') newRoomPosition = new RoomPosition(4, 5, creep.memory.far_target);
                else if (creep.memory.far_target === 'E27N47' ) newRoomPosition = new RoomPosition(38, 42, creep.memory.far_target);
                else newRoomPosition =  new RoomPosition(25, 25, creep.memory.far_target);
                let remote_controller = (room_name === creep.memory.far_target) ? creep.room.controller : newRoomPosition;
                // console.log('[DEBUG] (structCreep.run)(remote_claimer) [' + creep.name + ']: Cnstrctr: ' +  remote_controller.constructor.name + '; Reservation: ' + JSON.stringify(remote_controller.reservation) );
                if (remote_controller.constructor.name != 'newRoomPosition' && remote_controller.reservation && remote_controller.reservation.username != 'maxibra') {
                    attack_out = creep.attackController(remote_controller);
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Attack controller: ' + attack_out)
                    if (attack_out !== OK) creep.moveTo(remote_controller, global_vars.moveTo_ops);
                } else if (creep.reserveController(remote_controller) !== OK) {
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Reserve controller failed: ')
                    creep.moveTo(remote_controller, global_vars.moveTo_ops);
                }
                if (Game.time % 100 === 0) {
                    let cntr_text = 'Stay away from unnecessary conflicts :)'
                    if (remote_controller.sign && remote_controller.sign.text !== cntr_text)
                        creep.signController(remote_controller, cntr_text)
                }
                if (creep.ticksToLive === 1 && my_room.controller) {
                    try {
                        my_room.memory.endReservation = Game.time + remote_controller.reservation.ticksToEnd;
                    }
                    catch(err) {
                        Game.notify('[DEBUG] (ticksToEnd - Catch)[' + room_name + '][' + creep.name + ']: Remote_controler: ' + JSON.stringify(remote_controller) + '; Error' + err.message);
                    }
                }
                break;
            case 'remote_harvest':
                let name4log = 'stam';
                let remote_source;
                let rmt_harvest_role;
                let far_room = (room_name === creep.memory.far_target || room_name === 'E28N47');
                if (creep.name === name4log ) console.log('[DEBUG][' + creep.name + ']: FAR Room: ' + far_room)
                // if ((!Memory.rooms[creep.memory.far_target] || !Memory.rooms[creep.memory.far_target].energy_flow) && room_name !== creep.memory.far_target) {
                //     creep.moveTo(new RoomPosition(25, 25, creep.memory.far_target));
                //     return;
                // }
                // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Mem: ' + JSON.stringify(creep.memory, null, 2));
                if (creep.store.getFreeCapacity('energy') === creep.store.getCapacity() || creep.memory.role === 'harvest') {
                    let source_target = creep.pos.findClosestByRange(FIND_TOMBSTONES,{filter: object => (object.store[RESOURCE_ENERGY] > 200 &&
                                                                                                           !room_helpers.is_inside_wall(room_name, object))});
                    if (!source_target) {
                        // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Far target Room: ' + creep.memory.far_target);
                        if (Memory.rooms[creep.memory.far_target] && Memory.rooms[creep.memory.far_target].energy_flow) {
                            let room_containers = Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.source);
                            room_containers = room_containers.concat(Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.other));
                            let full_containers = [];
                            for (let c in room_containers) {
                                let current_container = Game.getObjectById(room_containers[c]);
                                if (current_container && current_container.store[RESOURCE_ENERGY] >= creep.store.getCapacity())
                                    full_containers.push(current_container);
                            }
                            source_target = creep.pos.findClosestByRange(full_containers);
                        } else {
                            source_target = null;
                        }
                    }
                    if (source_target) {
                        rmt_harvest_role = 'withdraw';
                        creep.memory.target_id = source_target.id;
                    }
                    rmt_harvest_role = (source_target) ? 'withdraw' : 'harvest';
                } else {
                    if (room_name !== creep.memory.homeland && creep.store.getUsedCapacity(RESOURCE_ENERGY) === creep.store.getCapacity()) {
                        rmt_harvest_role = 'undefined';
                        creep.memory.target_id = false;
                    }
                    // if (creep.name === name4log ) console.log('[DEBUG][' + creep.name + ']: Build? far_room: ' + far_room + '; my_room.memory.targets.build: ' + my_room.memory.targets.build)
                    if (far_room && (typeof my_room.memory.targets === 'object') &&
                        (typeof my_room.memory.targets.build === 'object') && Object.entries(my_room.memory.targets.build).length > 0) {
                        // if (creep.name === name4log ) console.log('[DEBUG][' + creep.name + ']: Changed to Build');
                        rmt_harvest_role = 'build';
                    }
                    else {
                        let repair_procent = 0.6;
                        let memory_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                        let avoid_repair = ['5b6299b65abaee4cd13cefa7',];
                        //object.room.name !== creep.homeland
                        // if (room_name !== creep.memory.far_target) return;
                        let target2repair = null;
                        if (far_room) {
                            target2repair = (memory_target && memory_target.hits < memory_target.hitsMax) ? memory_target :
                                              creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: object => (((object.structureType === STRUCTURE_ROAD || object.structureType === STRUCTURE_CONTAINER) && //|| object.structureType === STRUCTURE_RAMPART) &&
                                                                                                                object.hits/object.hitsMax < repair_procent && avoid_repair.indexOf(object.id) < 0))}) // || (object.structureType === STRUCTURE_WALL && object.hits < Memory.rooms.global_vars.defence_level_remote))});
                            // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Target2Repair: ' + JSON.stringify(target2repair, null, 2));

                        }
                        if (target2repair) {
                            // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] ---- Target2Repair ---: ' + JSON.stringify(target2repair, null, 2));
                            rmt_harvest_role = 'repair';
                            creep.memory.target_id = target2repair.id;
                        } else {
                            rmt_harvest_role = 'transfer';
                            creep.memory.target_id = false;
                        }
                    }
                }
                // console.log('[DEBUG][' + creep.name + ']: ROLE: ' + creep.memory.role)
                if (creep.name === name4log ) console.log('[DEBUG][' + creep.name + '] RMT HRVST. ROLE: ' + creep.memory.role + '; TARGET: ' +  creep.memory.target_id + '; FAR target: ' + creep.memory.far_target)
                switch(rmt_harvest_role) {
                    case 'withdraw':
                        let withdraw_target = Game.getObjectById(creep.memory.target_id);
                        if (creep.withdraw(withdraw_target, RESOURCE_ENERGY) !== OK) creep.moveTo(withdraw_target, global_vars.moveTo_ops);
                        else {
                            // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] (Withdraw) target_id is Changed to false');
                            creep.memory.target_id = false;
                        }
                        break;
                    case 'harvest':
                        if (creep.store.getFreeCapacity() === 0) {
                            // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] (HARVEST) target_id is Changed to false');
                            creep.memory.target_id = false;
                            creep.memory.role = false;
                            break;
                        }

                        let newRoomPosition = new RoomPosition(25, 25, creep.memory.far_target);
                        switch(room_name) {
                            case 'E32N53':
                                newRoomPosition = new RoomPosition(4, 5, creep.memory.far_target);
                                break;
                            case 'E26N41':
                                newRoomPosition = new RoomPosition(46, 38, creep.memory.far_target);
                                break;
                            case 'E28N48':
                            case 'E27N48':
                            case 'E28N47':
                               newRoomPosition = new RoomPosition(38, 42, creep.memory.far_target);
                                break;
                        }

                        remote_source = (room_name == creep.memory.far_target) ? creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE) :
                                                                                 newRoomPosition;

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
                        //     for (let l_id in my_room.memory.energy_flow.links.destinations) {
                        //         cur_target = Game.getObjectById(l_id);
                        //         if (cur_target && creep.pos.getRangeTo(cur_target) < 4)
                        //             transfer_target = cur_target;
                        //     }

                        // current_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                        // console.log('[DEBUG][' + creep.name + '] : ' +current_target)
                        // if (!current_target) {

                        // if (creep.store[RESOURCE_ENERGY]/creep.store.getCapacity() < 0.7) {
                        //     creep.memory.role = 'harvest'
                        // }

                        let transfer_targets = creep.memory.source_id;
                        let current_target;
                        // if (creep.name === name4log) console.log('[DEBUG][' + creep.name + ']: Room: ' + room_name + '; Homeland: ' +  creep.memory.homeland);
                        if (creep.memory.target_id) {
                            current_target = Game.getObjectById(creep.memory.target_id);
                        } else {
                            if (room_name === creep.memory.homeland) {
                                let extension_target = (!transfer_targets.map(function(m) {return my_room.memory.energy_flow.links.sources.includes(m)}).includes(true)) ?
                                                                            creep.pos.findClosestByPath(FIND_STRUCTURES,
                                                                                {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                                                                                                     && (object.store[RESOURCE_ENERGY] < object.store.getCapacity(RESOURCE_ENERGY)))}) :
                                                                            false;
                                if (extension_target) {
                                    current_target = extension_target;
                                } else {
                                    // current_target = false
                                    for (let t in transfer_targets) {
                                        // if (creep.name === 'rmt_hrvst_E32N49_E31N49-1-sp')
                                        // console.log('[DEBUG][' + creep.name + '] : ROOM: ' + room_name + '; target: ' + transfer_targets[t]);
                                        current_target = Game.getObjectById(transfer_targets[t]);
                                        if (!current_target) {
                                            // console.log('[DEBUG][' + creep.name + '] Missing Target ih Homeland ROOM: ' + room_name + '; target: ' + transfer_targets[t]);
                                            continue
                                        }
                                        if (((current_target.structureType === 'container' && current_target.store['energy'] < current_target.store.getCapacity()) ||
                                            ((current_target.structureType === 'link') && current_target.store[RESOURCE_ENERGY] < (current_target.store.getCapacity(RESOURCE_ENERGY) * 0.8))) &&
                                            (creep.pos.getRangeTo(current_target) < 20)) {
                                                // if (creep.name === 'rmt_hrvst_E37N48_E37N49-2-sp') console.log('[DEBUG](struct.creep-remote_harvest)[' + creep.name + ']: BREAK FOR target: ' + transfer_targets[t] + '; Distance: ' +  creep.pos.getRangeTo(current_target));
                                                break;
                                            }
                                    }
                                }
                            } else {
                                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] TARGET: ' + current_target);
                                current_target = Game.getObjectById(transfer_targets[0]);
                            }
                        }
                       console.log('[DEBUG] (structCreep.run)[' + creep.name + '] TARGET: ' + current_target);
                       creep.memory.target_id = current_target.id;
                        if (creep.transfer(current_target, RESOURCE_ENERGY) !== OK) creep.moveTo(current_target, global_vars.moveTo_ops);
                        else {
                           // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] (Transfer) target_id is Changed to false');
                           creep.memory.target_id = false;
                        }
                        // creep.memory.target_id = current_target.id;
                        // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] TARGET: ' + current_target);
                        break;
                }
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] REMOTE source: ' +  remote_source);
                // if (creep.memory.role === 'harvest' && remote_source.energyAvailable === 0) {
                //     creep.memory.role = false;
                //     creep.memory.target_id = false;
                // }
                // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Mem finish: ' + JSON.stringify(creep.memory));
                break;
            case 'mineral_miner':
                let room_mineral = Game.getObjectById(my_room.memory.energy_flow.mineral.id);
                let room_mineral_type = my_room.memory.energy_flow.mineral.type;
                let body_work_parts = creep.body.map(x=>x.type).indexOf('work')
                let ticks2suiced = ((creep.store.getCapacity()/body_work_parts) * EXTRACTOR_COOLDOWN) + 10
                if (creep.store.getUsedCapacity() === 0 && creep.ticksToLive < ticks2suiced) {
                    creep.suicide()
                    return;
                }
                // console.log('[DEBUG][' + creep.name + ']: Conditional: ' + (creep.store[room_mineral_type] === creep.store.getCapacity() || room_mineral.mineralAmount === 0))
                // if (room_name === 'E36N48') console.log('[DEBUG][' + creep.name + ']: Room mineral: ' + room_mineral_type + '; Terminal: ' + JSON.stringify(my_room.terminal.store));

                if (creep.store[room_mineral_type] === creep.store.getCapacity() || room_mineral.mineralAmount === 0) {
                    // let room_terminal = Game.getObjectById(my_room.memory.energy_flow.terminal);
                    // let terminal_status = _.sum(room_terminal.store)
                    // let transfer_target = (terminal_status < 250000) ? room_terminal : Game.getObjectById(my_room.memory.energy_flow.storage);

                    // Terminal must created first, before storage
                    let transfer_target;
                    // if (room_name === 'E39N49') console.log('[DEBUG][' + creep.name + ']: Labs obj: ' + JSON.stringify(my_room.memory.labs.reagent))
                    let lab_id = getKeyByValue(my_room.memory.labs.reagent, room_mineral_type);
                    let my_lab = (lab_id) ? Game.getObjectById(lab_id) : false;

                    // if (room_name === 'E36N48') console.log('[DEBUG][' + creep.name + ']: Lab: ' + lab_id + '; lab store: ' + my_lab.store[my_lab.mineralType] + '; Room mineral: ' + room_mineral_type + '; Terminal: ' + my_room.terminal.store[room_mineral_type]);

                    if (creep.memory.target_id)
                        transfer_target = Game.getObjectById(creep.memory.target_id);
                    // else if (my_lab && my_lab.store[my_lab.mineralType] < 0.85*my_lab.store.getCapacity(my_lab.mineralType))
                    //     transfer_target = my_lab;
                    else if ((my_room.terminal && (!my_room.terminal.store[room_mineral_type] || my_room.terminal.store[room_mineral_type] < Memory.rooms.global_vars.minerals.send_room)) ||
                        !my_room.storage)
                            transfer_target = my_room.terminal;
                    else
                            transfer_target = my_room.storage;

                    let mineral_missing = (transfer_target.structureType === 'lab') ? (transfer_target.store.getCapacity(transfer_target.mineralType) - transfer_target.store[transfer_target.mineralType]) :
                                                                                      creep.store[room_mineral_type];
                    let mineral2transfer = (mineral_missing < creep.store[room_mineral_type] ? mineral_missing : creep.store[room_mineral_type]);

                    if (creep.transfer(transfer_target, room_mineral_type, mineral2transfer) !== OK) {
                        creep.moveTo(transfer_target, global_vars.moveTo_ops);
                        // creep.memory.target_id = transfer_target.id;
                    } else {
                       // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] (Mineral miner) target_id is Changed to false');
                       creep.memory.target_id = false;
                    }
                } else {
                    // console.log('[DEBUG][' + creep.name + ']: MINERAL harvest. Type: ' + room_mineral_type + '; Target: ' + room_mineral.id + '; HARVEST: ' + creep.harvest(room_mineral))
                    if (creep.harvest(room_mineral) !== OK) creep.moveTo(room_mineral, global_vars.moveTo_ops);
                }
                break;
            case 'energy_miner':
                let my_container_id = creep.memory.target_id;
                let cpu_before;

                // console.log('[DEBUG][' + creep.name + '] My container: ' + my_container_id)
                if (my_container_id && Game.getObjectById(my_container_id).store.getFreeCapacity('energy') === 0 &&
                    my_room.memory.energy_flow.containers.source[my_container_id].creeps_moving2me.length == 0 &&
                    my_room.memory.global_vars.status === 'peace' &&
                    my_room.memory.global_vars.all_full) {
                        my_room.memory.energy_flow.containers.miner_is_needed = false;
                        my_room.memory.energy_flow.containers.source[my_container_id].miner_id = false
                        creep.suicide()
                        // return;
                }

                if (creep.ticksToLive < 3)
                    my_room.memory.energy_flow.containers.source[my_container_id].miner_id = false

                let target_room_obj = Game.rooms[creep.name.substring(8,14)]; // nrg_mnr_E34N47-1-sp
                // console.log('[' + creep.name + ']: Room: ' + ((Game.rooms[creep.name.substring(8,14)]) ? Game.rooms[creep.name.substring(8,14)].name : creep.name.substring(8,14))); //+ '; CNTRN: ' + target_room_obj.memory.energy_flow.containers.source);
                let source_containers = (target_room_obj.memory.energy_flow.containers.source) ?target_room_obj.memory.energy_flow.containers.source : [];
                let cntnr_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                if (!cntnr_target) {
                    for (let c in source_containers) {
                        if (creep.name == "nrg_mnr_E36N49-1-sp" ) console.log('[' + creep.name + ']: CNTRN: ' + c + '; ' + JSON.stringify(target_room_obj.memory.energy_flow.containers.source[c]))
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
                } else {
                    if (creep.pos.x !== cntnr_target.pos.x || creep.pos.y !== cntnr_target.pos.y) creep.moveTo(cntnr_target, global_vars.moveTo_ops);
                    else if (cntnr_target.store['energy'] < cntnr_target.store.getCapacity()) {
                        // console.log('[' + creep.name + ']: HARVEST' + target_room_obj.memory.energy_flow.containers.source[cntnr_target.id].source_id);
                        creep.harvest(Game.getObjectById(target_room_obj.memory.energy_flow.containers.source[cntnr_target.id].source_id))
                    }
                }
                break;
            case 'upgrader':
                // let closer_link_id = creep.memory.target_id;
                // if (!closer_link_id)
                //     for (let l_id in my_room.memory.energy_flow.links.destinations) {
                //         if (Game.getObjectById(l_id).pos.getRangeTo(my_room.controller) < 6) {
                //             closer_link_id = l_id;
                //             creep.memory.target_id = closer_link_id;
                //             break;
                //         }
                //     }
                let withdraw_target = Game.getObjectById(my_room.memory.energy_flow.links.near_controller);
                let controller_containers = {
                    // 'E32N49': Game.getObjectById('5b33639acb21c464f0c933a3'),
                    // 'E27N41': Game.getObjectById('5b7b9da33b41006a20d49491'),
                };
                // if (room_name === 'E36N49') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] UPGRADER');
                // if ((room_name === 'E34N47' || room_name === 'E28N48') && (!withdraw_target || withdraw_target.store[RESOURCE_ENERGY] === 0) && my_room.terminal.store[RESOURCE_ENERGY] > 20000) withdraw_target = my_room.terminal;
                if (controller_containers[room_name] && controller_containers[room_name].store.energy >= creep.store.getCapacity()) withdraw_target = controller_containers[room_name];

                if (creep.store[RESOURCE_ENERGY] === 0) {
                    if (creep.withdraw(withdraw_target, RESOURCE_ENERGY) !== OK) creep.moveTo(withdraw_target, global_vars.moveTo_ops);
                    // if (room_name === 'E34N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: ACT: ' + creep.withdraw(withdraw_target, RESOURCE_ENERGY))
                } else {
                    // if (room_name === 'E34N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: UPGRADE')
                    if (creep.upgradeController(my_room.controller) !== OK) creep.moveTo(my_room.controller, global_vars.moveTo_ops);
                }
                break;
            case 'its_my':
                // let my_new_room = creep.memory.claim_room;
                let my_new_room = 'E36N49';
                let claim_target = new RoomPosition(16, 34, my_new_room);
                console.log('****   CLAIME TARGET: ' + JSON.stringify(claim_target));
                if (creep.pos.isNearTo(claim_target)) {
                    let action_out = creep.claimController(Game.rooms[my_new_room].controller);
                    console.log('****   CLAIME: ' + action_out);
                } else creep.moveTo(claim_target, global_vars.moveTo_ops);
                if (Game.rooms[my_new_room] && Game.rooms[my_new_room].controller.my) creep.signController(claim_target, "Stay away from unnecessary conflicts :)");
                break;
            case 'energy_helper':
                // let source_target = Game.getObjectById('5acc524f6bec176d808adb71'); // E36N48
                let source_target;
                let cur_destination;

                if(creep.store[RESOURCE_ENERGY] === 0 && creep.ticksToLive < 50) {
                    creep.suicide();
                    return
                }

                if (!creep.memory.target_id) {
                    if(room_name === 'E28N48' || room_name === 'E27N47') {   // help E27N48 to E27N47
                    // if(room_name === 'E38N48' || room_name === 'E38N47') {   // help E38N48 to E38N47
                    // if(room_name === 'E28N48' || room_name === 'E29N47') {   // help E28N48 to E29N47
                    // if(room_name === 'E29N47' || room_name === 'E27N48' || // E29N47 help to E27N48
                    //   room_name === 'E36N48' || room_name === 'E37N48' ) {     // E37N48 helps to E36N48
                    // if(room_name === 'E37N48' || room_name === 'E38N47') {   // help E38N48 to E38N47
                    // if(room_name === 'E37N48' || room_name === 'E36N48') {    // help E36N48 to E37N48
                    // if(room_name === 'E38N48' || room_name === 'E36N48') {    // help E36N48 to E38N48
                        if (creep.store[RESOURCE_ENERGY] === 0) {
                            creep.memory.target_id = '5b363c9fc4e9c15e2b1c6ea5';    // Terminal E28N48
                            // creep.memory.target_id = '5b2cc739f727462af9e9828a';    // Storage E28N48
                            // creep.memory.target_id = '5afd3bd34337e90a8c6d9253';    // Storage E37N48
                            // creep.memory.target_id = '5b363c9fc4e9c15e2b1c6ea5';    // Terminal E38N48
                            // creep.memory.target_id = '5df779199310177754b90e5f';    // Storage E29N47
                            // if(room_name === 'E29N47' || room_name === 'E27N48') {   // E29N47 helps to E27N48
                            //     creep.memory.target_id = '5dff0243242a6cc040944a9b';    // Terminal E29N47
                            // } else if(room_name === 'E36N48' || room_name === 'E37N48') {   // E37N48 helps to E36N48
                            //     creep.memory.target_id = '5acc524f6bec176d808adb71';    // Terminal E37N48
                            // }
                            // creep.memory.target_id = '5afd6ab8f686ff54854efc5a';    // Storage E38N48
                            // creep.memory.target_id = '5afd9b372c5d4f7e24b2bf4c';    // Storage E36N48
                        } else {
                            // let dst_targets = [];
                            let dst_targets = ['6122a77cca959ab04371f0b7', ]; // Containers E27N47
                            // let dst_targets = ['5b8af7829a49221b47f8ac05', ]; // Containers E26N48
                            // let dst_targets = ['5b11bf4882c1ef67174cd56e', ]; // Links and storage E38N47
                            // if(room_name === 'E29N47' || room_name === 'E27N48') {   // E29N47 helps to E27N48
                            //     dst_targets = ['5e39527d2f947b0503c43194', '5e04d5a4a2a04c36e3e89dbd']; // Containers in E27N48
                            // } else if(room_name === 'E36N48' || room_name === 'E37N48') {   // E37N48 helps to E36N48
                            //     dst_targets = ['5e47e1931f54ab0af5ef33f0']; // Storage in E36N48
                            // }
                            // let dst_targets = ['5dfb397900711a2d37b98aef', '5dfba7a0a4a113ba61e26341', '5df5db14e2c8ff169f1a8a2f', '5df52c309a7beeffdb7070f1']; // Links and storage E29N47
                            // let dst_targets = ['5abfed40aafade1bd3be494f', '5b0c860fc8820666c2e70371', '5acc524f6bec176d808adb71']; // Links and terminal E37N48
                            // let dst_targets = ['5ac6ac8f8f27a14b942a5be4', '5ad024eac27319698ef58448']; // Links and terminal E38N48
                            for (let t in dst_targets) {
                                let cur_target = Game.getObjectById(dst_targets[t]);
                                creep.memory.target_id = dst_targets[t];
                                if (cur_target.store[RESOURCE_ENERGY] < cur_target.store.getCapacity(RESOURCE_ENERGY)) break;   // the first destination must be LINKS
                            }
                        }
                    }
                }

                if (creep.store[RESOURCE_ENERGY] === 0) {
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
                let minerals = Object.keys(creep.store);
                for (let m in minerals) {
                    let act_response = creep.transfer(mineral_transfer_target, minerals[m]);
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: MINERAL: ' + minerals[m] + '; ACT out: ' + act_response)
                    creep_helpers.most_creep_action_results(creep, mineral_transfer_target, act_response, creep_role);
                }
                break;
            case 'transfer':
                let cur_transfer_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : transfer_target;
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Target: ' + cur_transfer_target + '; Trans target: ' + transfer_target + '; Mem Target: ' + creep.memory.target_id)
                // if (!cur_transfer_target) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFER TARGET??? : ' + JSON.stringify(cur_transfer_target));

                // cur_transfer_target = Game.getObjectById('5ae2b2e96abb293c4600b189')

                creep.memory.target_id = (cur_transfer_target) ? cur_transfer_target.id: false;
                let energy_missing = (cur_transfer_target) ? cur_transfer_target.store.getCapacity(RESOURCE_ENERGY) - cur_transfer_target.store[RESOURCE_ENERGY] : 0;
                let energy2transfer = (energy_missing < creep.store[RESOURCE_ENERGY] ? energy_missing : creep.store[RESOURCE_ENERGY]);
                let act_response = creep.transfer(cur_transfer_target, RESOURCE_ENERGY, energy2transfer);
                if(room_name === 'E39N49') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Target: ' + cur_transfer_target.structureType + '; Act OUT: ' + act_response);
                creep_helpers.most_creep_action_results(creep, cur_transfer_target, act_response, creep_role);
                let creep_minerals = Object.keys(creep.store);
                if (cur_transfer_target && cur_transfer_target.id === my_room.memory.energy_flow.storage && creep_minerals.length > 1) {
                    for (let m in creep_minerals) creep.transfer(cur_transfer_target, creep_minerals[m]);
                    creep.memory.role = false;
                    // if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] (Transfer-1117) target_id is Changed to false');
                    creep.memory.target_id = false;
                    if (Object.keys(creep.store).length === 1) creep.memory.has_minerals = false;
                }
                break;
            case 'repair_defence':
                var target;
                if (creep.memory.target_id)
                    target = (Game.time % 20 === 0 &&
                                (Memory.rooms[room_name].global_vars.status ==='war' || !room_vars.all_full)) ? false : Game.getObjectById(creep.memory.target_id);
                else {
                    let ids_object = my_room.memory.targets.creep_repair_defence.map(x => Game.getObjectById(x))
                    target = creep.pos.findClosestByRange(ids_object);
                }

                if ((target && target.hits < target.hitsMax)) { // && my_room.memory.global_vars.all_full) {
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Defence repair Target: ' + target.id + '; Action out: ' + creep.repair(target))
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else {
                    creep.memory.role = false;
                    target_index = my_room.memory.targets.creep_repair_defence.indexOf(target.id)
                    if (target_index > 0) my_room.memory.targets.creep_repair_defence.splice(target_index, 1);
                    // my_room.memory.targets.creep_repair_defence = false
                    // my_room.memory.targets.repair_defence = false
                }
                break;
            case 'repair_civilian':
                // var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_civilian));
                // var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_ROAD || object.structureType == STRUCTURE_CONTAINER) && object.hits/object.hitsMax <= 0.8});
                var target = Game.getObjectById(my_room.memory.targets.repair_civilian); // the most targets are roads => stuck on them
                if (target) {
                    if (target.hits < target.hitsMax)
                        creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                    else
                        my_room.memory.targets.repair_civilian = false

                } else {
                    creep.memory.role = 'build';
                    // creep.memory.role = false;
                    // creep.memory.target_id = false;
                }
                if (creep.name === log_name) console.log('[DEBUG] (struct_Creep)[' + creep.name +'] target: ' + target + '; mem.civil: ' + my_room.memory.targets.repair_civilian)
                break;
            case 'build':
                build_action(my_room, creep);
                break;
            case 'upgrade':
                var target = (Game.time % 20 === 0 &&
                                (Memory.rooms[room_name].global_vars.status ==='war' ||
                                !my_room.memory.global_vars.all_full ||
                                creep.room.controller.ticksToDowngrade > CONTROLLER_DOWNGRADE[my_room.controller.level]*0.98)
                             ) ? false : creep.room.controller;
                if (target) {   // #TODO: || my_room.controller.level < 3
                    let act_out =  creep.upgradeController(target)
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Act out: ' + act_out + '; Controler: ' + JSON.stringify(target, null, 2))
                    creep_helpers.most_creep_action_results(creep, target, act_out, creep_role);
                } else {
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] All_full: ' + my_room.memory.global_vars.all_full + '; Switch from upgrading')
                    creep.memory.role = false;
                    creep.memory.target_id = false;
                }
                break;
            case 'dropper':
                let closest_containers = Game.getObjectById(creep.memory.target_id);
                if (creep.pos.getRangeTo(closest_containers) == 0) {
                    creep.drop(RESOURCE_ENERGY);
                } else creep.moveTo(closest_containers, global_vars.moveTo_ops);
                break;
            case 'worker':
                let worker_room = creep.name.substring(14, 20);
                // let worker_location = new RoomPosition(25, 25, worker_room);
                let worker_location = Game.rooms[worker_room].controller;
                if (creep.name === 'worker_E37N48_E36N48-2') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Location: ' + worker_location + '; Range: ' + (creep.pos.getRangeTo(worker_location) > 3));
                if (creep.name === 'worker_E37N48_E36N48-2') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] MoveTo output: ' +  creep.moveTo(worker_location, global_vars.moveTo_ops));
                if (creep.pos.getRangeTo(worker_location) > 10) creep.moveTo(worker_location, global_vars.moveTo_ops);
                else {     // Need if creep came with any energy
                // if (room_name === 'E38N47' && creep.pos.y > 2) {     // Need if creep came with any energy
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Change to undefined');
                    creep.memory.role = false;
                }
                break;
            case 'claimer':
                let new_room = 'E37N48';
                let new_location = new RoomPosition(25,25,new_room);
                // let new_location = Game.getObjectById('59f1a4e382100e1594f3db1a');  // controller of E28N48
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Location: ' + new_location + '; Range: ' + (creep.pos.getRangeTo(new_location) > 3))
                if (creep.pos.getRangeTo(new_location) > 3) creep.moveTo(new_location, global_vars.moveTo_ops);
                if (room_name === new_room && creep.pos.x < 49) {     // Need if creep came with any energy
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Change to undefined');
                    creep.memory.role = false;
                }
                break;
            case 'attacker_constructions':
                targets_list = creep.memory.constructions2attack;
                for (let s in targets_list) {
                    let current_construction = Game.getObjectById(creep.memory.constructions2attack[s]);
                    if (current_construction){
                        console.log('[DEBUG] (structCreep.attacker_constructions)[' + creep.name + '] Const: ' + current_construction.id);
                        if (creep.attack(current_construction) !== OK) creep.moveTo(current_construction);
                        break;
                    } else {
                        // creep.memory.constructions2attack = targets_list.shift()
                    }
                }
                break;
            case 'attacker':
                let attacked_room = creep.memory.room_in_war;
                let hostile_creeps_ids = [];

                // let t = Game.getObjectById('5b4b2d0d364bfc2d1ef2bd6d');
                // if ( creep.heal(t) !== OK) creep.moveTo(t, global_vars.moveTo_ops);
                // t = Game.getObjectById('5b31d6a07cac973a8f2efb60');
                // if ( creep.attack(t) !== OK ) creep.moveTo(t, global_vars.moveTo_ops);
                // return

                let room_position = (creep.memory.far_target === 'E27N47') ? new RoomPosition(38,42, attacked_room) :  new RoomPosition(25,25, attacked_room);
                // if (creep.memory.far_target == 'E27N47' && Memory.rooms['E27N47'].targets.hostile.invader_core.length > 0)
                //     room_position = new RoomPosition(10,27, attacked_room);
                if (room_name !== attacked_room || creep.pos.x < 1 || creep.pos.x > 49 || creep.pos.y < 1 || creep.pos.y > 49) creep.moveTo(room_position, global_vars.moveTo_ops);
                else if (my_room.memory.targets.hostile_amount > 0 ) {
                    if (my_room.memory.targets.hostile.heal.length > 0) hostile_creeps_ids = my_room.memory.targets.hostile.heal;
                    else if (my_room.memory.targets.hostile.attack.length > 0) hostile_creeps_ids = my_room.memory.targets.hostile.attack;
                    else if (my_room.memory.targets.hostile.invader_core.length > 0) hostile_creeps_ids = my_room.memory.targets.hostile.invader_core;
                    else if (my_room.memory.targets.hostile.claim.length > 0) hostile_creeps_ids = my_room.memory.targets.hostile.claim;
                    else hostile_creeps_ids = my_room.memory.targets.hostile.other;

                    let hostile_creeps = []
                    for (let i of hostile_creeps_ids) {
                        hostile_creeps.push(Game.getObjectById(i))
                    }

                    let target2attack = creep.pos.findClosestByRange(hostile_creeps);
                    if (creep.rangedAttack(target2attack) !== OK || creep.attack(target2attack) !== OK) creep.moveTo(target2attack);
                    // console.log('[DEBUG] (structCreep-attacker)[' + creep.name + '] After: ' + target2attack.hits)
                } else if (Memory.rooms[room_name].global_vars.status ==='war') {
                        Memory.rooms[room_name].global_vars.status = 'peace';
                        // Game.notify('[INFO] (structCreep-attacker)[' + room_name + '][' + creep.name + '] We won on claimed area');
                }

                if (creep.hits < creep.hitsMax) creep.heal(creep);
                else if (my_room.memory.targets && my_room.memory.targets.hostile_amount === 0 && my_room.memory.targets.my2heal.length > 0) {
                    let my_creeps2heal = [];
                    for (let i of my_room.memory.targets.my2heal) my_creeps2heal.push(Game.getObjectById(i));
                    my_creep2heal = creep.pos.findClosestByRange(my_creeps2heal);
                    if (creep.heal(my_creep2heal) !== OK) creep.moveTo(my_creep2heal);
                } else if (room_name === attacked_room && my_room.memory.targets.hostile_amount === 0) {
                    // Game.notify('[INFO] (structCreep-attacker)[' + room_name + '][' + creep.name + '] All creeps are healthy on the room. Bye, Bye');
                    creep.suicide();
                    return
                }

                if (creep.room.name === 'E38N49') creep.memory.role = false;
                break;
            case 'go_close':
                let c_id = false;
                switch (creep.room.name) {
                    case 'E34N47':
                        if (creep.pos.x > 18 && creep.pos.y < 13) creep.memory.role = false;
                        else c_id = my_room.memory.energy_flow.mineral.id;
                        break;
                    case 'E38N47':
                        if (creep.pos.y < 13) creep.memory.role = false;
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
        // boost_me: function() {
        //     // boost_ops = {
        //     //     'move': 'XZHO2',
        //     //     'attack': 'XUH2O'
        //     // }
        // }
    },
    boost_me: function(my_room, creep) {
        boost_price = {
            'mineral': 30,
            'energy': 20
        };
        boost_type = {
            'move': 'XZHO2',
            'attack': 'XUH2O',
            'ranged_attack': 'XKH2O',
            'carry': 'XKHO2',
            'heal': 'XLHO2',
            'tough': 'XGHO2',
            'work': 'GH2O'
        };
        booster_lab = Game.getObjectById(my_room.memory.labs.booster);

        my_body = creep.body;
        my_body_parts = {};
        full_price = {};
        for (b_indx in my_body) {
            if (my_body_parts[my_body[b_indx].type]) my_body_parts[my_body[b_indx].type] += 1;
            else my_body_parts[my_body[b_indx].type] = 1;
            if (full_price[boost_type[my_body[b_indx].type]]) {
                full_price[boost_type[my_body[b_indx].type]]['mineral'] += boost_price['mineral'];
                full_price[boost_type[my_body[b_indx].type]]['energy'] += boost_price['energy']
            } else full_price[boost_type[my_body[b_indx].type]] = {'mineral': boost_price['mineral'], 'energy': boost_price['energy']}
        }
        for (mineral in full_price) {
            // Verify that the boosting needs at the most 20% from the current amount of the given mineral in the Storage
            //      and the needed energy at the most 20% from the current amount of it in the boost lab
            if ((full_price[mineral]['mineral'] < (my_room.storage.store[mineral]*0.2)) &&
                (full_price[mineral]['energy'] < (booster_lab.store[RESOURCE_ENERGY]*0.2))) {
                transfer_mineral2boost(creep, my_room.storage, booster_lab, mineral)
            }
        }
    }
};

module.exports = structCreep;
