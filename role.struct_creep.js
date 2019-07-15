var creep_helpers = require('creep_helpers');
var role_harvester = require('role.harvester');
var room_helpers = require('room_helpers');

//var global_vars = require('global_vars')();

// var spawn_name = 'max';
// var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
// var my_room = Game.rooms[global_vars.room_name];
var global_vars = Memory.rooms.global_vars;

function build_action(my_room, creep) {
    let build_target;
    if (my_room.memory.targets.build.indexOf(creep.memory.target_id) > -1) build_target = Game.getObjectById(creep.memory.target_id);
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
                // creep.memory.target_id = false;
        }
    } else creep.memory.role = 'undefined';
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key].type === value);
}

function get_missing_reagent_labs_id(my_room) {
    let missing_reagent_labs_id = [];
    for (let l in my_room.memory.labs.reagent) {
        let current_lab = Game.getObjectById(l);
        if (current_lab.mineralAmount < (current_lab.mineralCapacity - Memory.rooms.global_vars.minerals.transfer_batch)) missing_reagent_labs_id.push(l);
    }
    // console.log('[DEBUG] (structCreep.get_full_produce_labs)[' + my_room.name + '] REAGENT_LABS: ' + JSON.stringify(missing_reagent_labs_id))
    return missing_reagent_labs_id;
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
        // console.log('[DEBUG] (structCreep.run)[' + room_name + ']');
        let fill_terminal = (my_room.terminal &&
                             my_room.terminal.store[RESOURCE_ENERGY] < Memory.rooms.global_vars.terminal_max_energy_storage &&
                             my_room.memory.energy_flow.store_used.terminal < my_room.memory.energy_flow.max_store.terminal);
        let critical_controller_downgrade = (room_vars.status === 'peace') ? 150000 : 130000
        // It's nothing todo
        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] unemployed role: ' + creep.memory.role + '; full: ' + my_room.memory.global_vars.all_full + 'store_used.terminal: ' + my_room.memory.energy_flow.store_used.terminal + '; max_store.terminal: ' + my_room.memory.energy_flow.max_store.terminal);

        // if (creep.name === 'E39N49-1-gn') {
        //     if (_.sum(creep.carry) === 0) {
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

        if (my_room.memory.global_vars.all_full && creep.memory.role === 'undefined' &&
            units[room_name]['upgrader'] > 0 && (Game.time % 10) !== 0 &&
            (my_room.memory.energy_flow.store_used.terminal > my_room.memory.energy_flow.max_store.terminal ||
             my_room.terminal.store[RESOURCE_ENERGY] > Memory.rooms.global_vars.terminal_max_energy_storage)) {
                console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Im unemployed');
                return;
        }

        if(creep.name.slice(-2) === "gn" && creep.carry['energy'] === 0 && creep.ticksToLive < 20) {
            console.log('[DEBUG] (structCreep.run)[' + creep.name + '] A few live to do something. Suicide')
            creep.suicide();
            return;
        }

        // Suicide of energy miners if both of containers near cources are full.
        const add = (a, b) => a + b;
        if (creep.name.substring(0,7) === 'nrg_mnr' &&
            !fill_terminal &&
            (Object.keys(my_room.memory.energy_flow.containers.source).map(x => Game.getObjectById(x).store.energy).reduce(add)) === 4000) {
            creep.suicide();
            return;
        }

        let condition2change_role = (iam_general &&
                                     ((creep.memory.role === 'harvest' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) ||
                                      creep.memory.role === 'undefined' ||
                                      (creep.memory.target_id === my_room.controller.id &&
                                        (my_room.energyAvailable < (my_room.energyCapacityAvailable*0.85) ||
                                        (my_room.controller.ticksToDowngrade > 145000 &&
                                         fill_terminal)))));

        if (condition2change_role) creep.memory.target_id = false;
        // *** LOG
        // if (creep.name === log_name) 
        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Time: ' + Game.time + '; Controller: ' + JSON.stringify(controller_position) + '; Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        // ********
        // *** UNIT LOG
        // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Start Creep mem: ' + JSON.stringify(creep.memory));
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
        } else if (creep.name.substring(0,6) === 'worker' && creep.pos.getRangeTo(new RoomPosition(25, 25, creep.name.substring(14,20))) > 24) {
            creep.memory.role = 'worker';
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
        // } else if (my_room.controller.level === 8 && creep.pos.getRangeTo(Game.rooms[room_name].controller) <= range2upgrade && !creep.memory.special) {
        //     creep.memory.role = 'transfer';
        //     transfer_target = my_room.terminal;
        //     creep.memory.target_id == my_room.terminal;            
        // } else if (my_room.controller.level < 8 &&
        //           creep.pos.getRangeTo(Game.rooms[room_name].controller) < range2upgrade && units[room_name]['total'] >= 3 && 
        //           !(room_name === 'E33N47' && creep.pos.y < 13) && room_name !== 'E32N49' &&
        //           !(room_name === 'E32N49' && my_room.controller.pos.findInRange(FIND_MY_CREEPS, 3).length > 3)) {
        // //             (my_room.controller.level < 8 || (my_room.controller.level === 8 && my_room.controller.ticksToDowngrade < 149900))) ||
        // //             (room_vars.status === 'peace' && units[room_name]['total'] >= 2 && creep.ticksToLive > 1000 && units[room_name]['upgrade'] < 1 && my_room.controller.level !== 8))) { // ||
        // //             // (my_room.controller.level === 8 && my_room.controller.ticksToDowngrade < 139000 && units[room_name]['upgrade'] < 1) ))  && 
        // //         //   (creep.pos.getRangeTo(far_source) > 5) && !(room_name === 'E38N47' && room_vars.status == 'war')){
        // //             // creep.room.lookForAtArea(LOOK_CREEPS,controller_position.y-3,controller_position.x-3,controller_position.y+3,controller_position.x+3, true).length === 0)) {
        //     if (creep.memory.role !== 'upgrade') creep.say('upgrading');
        //     creep.memory.role = 'upgrade';
        //     units[room_name]['upgrade']++;
        } else if (condition2change_role) {
            var current_workers = units[room_name]['total'] - units[room_name]['harvest'];
            var current_creep_types = room_vars.creep_types[room_vars.status];
            //TODO: Improve pleace of tower. don't search per creep
            let transfer_procent = units[room_name]['transfer']/current_workers;
            let extensions_first = my_room.memory.energy_flow.extension_first;

            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: BUILD structures: ' + (my_room.memory.targets.build.length)) // && units[room_name]['build']/current_workers < current_creep_types.build));

            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfers: ' + transfer_procent +' / ' + current_creep_types.transfer);
            // ********
            if (Memory.rooms[room_name].global_vars.status === 'peace' && !extensions_first)
                transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER && 
                                                                                                      object.energy/object.energyCapacity < (Memory.rooms.global_vars.min_tower_enrg2repair+0.1))});

            let current_body_cost = (my_room.energyCapacityAvailable < my_room.memory.global_vars.max_body_cost) ? my_room.energyCapacityAvailable : my_room.memory.global_vars.max_body_cost;
            // let room_enegry_is_good = (my_room.energyAvailable >= (my_room.energyCapacityAvailable * 0.6) && my_room.energyAvailable >= current_body_cost);
            // *** UNIT LOG
            // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS target TOWER: ' + transfer_target);
            // ********
            // if (room_name === 'E34N47' && creep.pos.isNearTo(far_source)) {
            //     transfer_target = Game.getObjectById('5ad1a3171db6bf2fc4648b26');   // ID of far link in the room E34N47
            //     creep.memory.role = 'transfer';
            // } else 
            if (transfer_target && !my_room.memory.towers.current[transfer_target.id]) { // && room_enegry_is_good 
                // *** LOG
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target TOWER: ' + JSON.stringify(transfer_target));
                creep.say('transfering');
                creep.memory.role = 'transfer';
                my_room.memory.towers.current[transfer_target.id] = creep.name;
            } else {  
                transfer_target = false; 
                let range2link = 5;
                if (room_name === 'E39N49' ||
                    room_name === 'E37N48') range2link = 18; 
                else if (room_name === 'E38N47' || 
                         room_name === 'E34N47') range2link = 15;

                // let link_sources = (my_room.memory.energy_flow.links.near_sources) ? my_room.memory.energy_flow.links.near_sources : [];
                let link_sources = my_room.memory.energy_flow.links.near_sources;
                // link_sources = link_sources.concat(my_room.memory.energy_flow.links.sources);
                if (room_name =='E34N47') link_sources = link_sources.concat(my_room.memory.energy_flow.links.near_controller);

                // if (room_name === 'E32N49') console.log('[DEBUG] (structCreep.run)[' + creep.name + '] LINKS: ' + link_sources + '; ENgry_FLow: ' + JSON.stringify(my_room.memory.energy_flow.links));

                for (let l in link_sources) { // try transfer to link
                    cur_transfer_target = Game.getObjectById(link_sources[l]);
                    if (cur_transfer_target && 
                        Memory.rooms[room_name].global_vars.status === 'peace' && !extensions_first &&
                        ((cur_transfer_target.energy/cur_transfer_target.energyCapacity < 0.7) && (creep.pos.getRangeTo(cur_transfer_target) < range2link) ||
                        (creep.pos.isNearTo(cur_transfer_target) && cur_transfer_target.energy < cur_transfer_target.energyCapacity))) {
                        transfer_target =  cur_transfer_target;
                        break;
                    }
                }
                // if (room_name === 'E34N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target LINK: ' + JSON.stringify(transfer_target));
                if (!(transfer_target)) { // transfer to extensions or spawn // && room_enegry_is_good
                    transfer_target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                        && (object.energy < object.energyCapacity))});
                }
                
                // if (room_name === 'E37N48' && transfer_target) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target (EXTENSIONS?): ' + transfer_target.structureType + '; ID: ' + transfer_target.id + '; transfer_procent: ' + transfer_procent + '; condition: ' + (transfer_target && (transfer_procent <= current_creep_types.transfer)));
                let booster_lab_id = (my_room.memory.labs) ? Object.keys(my_room.memory.labs.booster)[0] : false;
                if (!transfer_target && booster_lab_id) {    
                    let booster_lab = Game.getObjectById(booster_lab_id);
                    if (booster_lab && booster_lab.energy < booster_lab.energyCapacity) transfer_target = booster_lab;
                }
                
                if (!transfer_target) { // transfer to NUKER
                    transfer_target = creep.pos.findClosestByPath(FIND_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_NUKER)
                        && (object.energy < object.energyCapacity))});
                }
                
                // *** LOG
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Transfer Target: ' + JSON.stringify(transfer_target));
                // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Terminal cond: ' + (my_room.memory.global_vars.all_full))
                // if (creep.name === log_name) console.log('[DEBUG][' + creep.name + '] BUILD condition. my_room.memory.targets.build:' + my_room.memory.targets.build + 'units[room_name][build]: ' + (units[room_name]['build']/current_workers) + 'current_creep_types.build: ' + current_creep_types.build);

                if(transfer_target && (transfer_procent <= current_creep_types.transfer)) {
                    creep.say('transfering');
                    creep.memory.role = 'transfer';
    
                    // *** UNIT LOG
                    // if (creep.name === log_name) console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                    // ********
    
                    //units[room_name].transfer++;
                } else if (my_room.controller.level < 6 && my_room.memory.targets.repair_civilian && units[room_name]['repair_civilian']/current_workers <= current_creep_types.repair_civilian) {
                    creep.say('civilian repair');
                    creep.memory.role = 'repair_civilian';
                    //units[room_name].repair_civilian++;
                } else if (my_room.memory.targets.build && units[room_name]['build']/current_workers <= current_creep_types.build) {
                    creep.say('building');
                    console.log('[DEBUG][' + creep.name + '] Try run to build: ' )
                    creep.memory.role = 'build';
                    units[room_name].build++;
                } else if (my_room.controller.level < 6 && my_room.memory.targets.repair_defence && units[room_name]['repair_defence']/current_workers <= current_creep_types.repair_defence) {
    
                    // *** GLOBAL LOG
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Changed ' + creep.memory.role + ' to repair_defence: ' + units[room_name]['repair_defence'] + ' / ' + current_workers + '=' + units[room_name]['repair_defence']/current_workers + '[' + current_creep_types.repair_defence +']')
                    // ********
    
                    creep.say('defence repair');
                    creep.memory.role = 'repair_defence';
                    //units[room_name].repair_defence++;
                    // Return here repair
                } else if (my_room.controller.level === 8 && my_room.controller.ticksToDowngrade < critical_controller_downgrade) { //  && creep.body.map(x=>x.type).indexOf('work') > -1) {
                    creep.say('low_controller');
                    creep.memory.role = 'upgrade';
                } else if ((my_room.controller.level === 8 || units[room_name]['upgrader'] > 0) && 
                           my_room.memory.energy_flow.terminal && 
                        //   my_room.memory.global_vars.all_full && 
                           fill_terminal) {
                    creep.say('to_terminal');
                    creep.memory.role = 'transfer';
                    transfer_target = Game.getObjectById(my_room.memory.energy_flow.terminal);
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFER to terminal: ' + transfer_target);
                } else if ((my_room.controller.level === 8 || units[room_name]['upgrader'] > 0) && 
                           my_room.memory.energy_flow.storage &&
                        //   my_room.memory.global_vars.all_full &&
                           my_room.memory.energy_flow.store_used.storage < my_room.memory.energy_flow.max_store.storage) {
                    creep.say('to_storage');
                    creep.memory.role = 'transfer';
                    transfer_target = Game.getObjectById(my_room.memory.energy_flow.storage);
                } else if (units[room_name]['upgrader'] === 0) {
                    creep.say('1-upgrading');
                    creep.memory.role = 'upgrade';
                }
                // else {
                //     creep.say("I'm LAB_ASSISTENT");
                //     creep.memory.role = 'lab_assistent';
                // }
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
                    let range2attack = creep.pos.getRangeTo(target2attack)
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
                let log_if_room = 'E38N48';

                if (creep.memory.target_id) {
                    target_object = Game.getObjectById(creep.memory.target_id)
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] TARGET ID : ' + creep.memory.target_id + '; MINERAL: ' + creep.memory.mineral2withdraw)
                    if (creep.pos.isNearTo(target_object)) {
                        mineral = _.remove(Object.keys(creep.carry), function(mineral_type) { return mineral_type != "energy"; })[0];
                        if (mineral) {
                            creep.transfer(target_object, mineral)
                            creep.memory.mineral2withdra = false
                        }
                        else creep.withdraw(target_object, creep.memory.mineral2withdraw)
                        creep.memory.target_id = false
                    } else creep.moveTo(target_object, global_vars.moveTo_ops);
                } else {    // target_id doesn't defined
                    const total = _.sum(creep.carry);
                    if (total == 0) {   // The creep is empty
                        // my_room.find(FIND_TOMBSTONES).forEach(tombstone => {
                        //     if(tombstone.creep.my){
                        //
                        //     }
                        // }
                        // Create object of good sources to withdraw {<id>: <mineral>,...}
                        sources2withdraw = room_helpers.create_sources2withdraw(room_name)
                        lab2withdraw = room_helpers.get_lab2withdraw(room_name)
                        sources2withdraw[lab2withdraw[0]] = lab2withdraw[1]
                        sources_array = []
                        for (l_id in sources2withdraw) sources_array.push(Game.getObjectById(l_id))
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] SOURCES: ' + JSON.stringify(sources_array.length))

                        let closest_target2withdraw = creep.pos.findClosestByRange(sources_array)
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] CLOSEST ID: ' + closest_target2withdraw)
                        if (closest_target2withdraw) {
                            creep.memory.target_id = closest_target2withdraw.id
                            creep.memory.mineral2withdraw = sources2withdraw[closest_target2withdraw.id]
                        } else if (Game.getObjectById(my_room.memory.energy_flow.mineral.id).ticksToRegeneration > 100) {
                            lab_of_mineral = Game.getObjectById(my_room.memory.lab_per_mineral[my_room.memory.energy_flow.mineral.type])
                            free_space = lab_of_mineral.mineralCapacity - lab_of_mineral.mineralAmount
                            if (free_space > 250) {
                                creep.memory.target_id = my_room.storage.id
                                creep.memory.mineral2withdraw = my_room.memory.energy_flow.mineral.type
                            }
                        }

                        if (!creep.memory.target_id ) {  // It's no target was found
                            room_nuker = my_room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_NUKER } })[0]
                            if (my_room.terminal.store['G'] >= 200 && room_nuker.ghodium <= 4800) {
                                creep.memory.target_id = my_room.terminal.id
                                creep.memory.mineral2withdraw = "G"
                            }
                        }

                        if (!creep.memory.target_id ) {  // It's still no target was found
                            if (my_room.terminal.store[my_room.memory.energy_flow.mineral.type] < 50000) {
                                creep.memory.target_id = my_room.storage.id
                                creep.memory.mineral2withdraw = my_room.memory.energy_flow.mineral.type
                            }
                        }

                        } else  {   // The creep isn't empty
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] LAB ID : ' + room_helpers.get_lab_by_mineral(room_name, creep.memory.mineral2withdraw))
                        if (creep.pos.isNearTo(my_room.terminal))
                            if (creep.memory.mineral2withdraw == 'G' && room_nuker.ghodium <= 4800)
                                creep.memory.target_id = my_room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_NUKER } })[0].id
                            else
                                creep.memory.target_id = my_room.memory.lab_per_mineral[creep.memory.mineral2withdraw]
                        else
                            creep.memory.target_id = my_room.terminal.id
                        creep.memory.mineral2withdraw = creep.memory.mineral2withdraw
                    }
                }
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] AFTER Target ID : ' + creep.memory.target_id + '; MINERAL: ' + creep.memory.mineral2withdraw)
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
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: SRCs: ' + JSON.stringify(src_target.store) + '; SRC: ' + current_resource);
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
                let newRoomPosition = (room_name === 'E32N53') ? new RoomPosition(4, 5, creep.memory.far_target) :
                                                                 new RoomPosition(25, 25, creep.memory.far_target);
                // console.log('[DEBUG] (structCreep.run)(remote_claimer) [' + creep.name + ']: Room: ' +  room_name + '; Far Target: ' + creep.memory.far_target );
                let remote_controller = (room_name == creep.memory.far_target) ? creep.room.controller : newRoomPosition;  
                
                if (creep.reserveController(remote_controller) !== OK) creep.moveTo(remote_controller, global_vars.moveTo_ops);
                if (creep.ticksToLive === 1)
                    my_room.memory.endReservation = Game.time + my_room.controller.reservation.ticksToEnd;
                break;
            case 'remote_harvest':
                let name4log = 'stam';
                let remote_source;
                // if ((!Memory.rooms[creep.memory.far_target] || !Memory.rooms[creep.memory.far_target].energy_flow) && room_name !== creep.memory.far_target) {
                //     creep.moveTo(new RoomPosition(25, 25, creep.memory.far_target));
                //     return;
                // }
                // if (creep.name === name4log) console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Mem: ' + JSON.stringify(creep.memory));
                if (creep.carry[RESOURCE_ENERGY] === 0 || creep.memory.role === 'harvest') {
                    let transfer_target = creep.pos.findClosestByRange(FIND_TOMBSTONES,{filter: object => (object.store[RESOURCE_ENERGY] > 200 && 
                                                                                                           !room_helpers.is_inside_wall(room_name, object))});
                    if (!transfer_target) {
                        // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Room: ' + creep.memory.far_target);
                        if (Memory.rooms[creep.memory.far_target] && Memory.rooms[creep.memory.far_target].energy_flow) { 
                            let room_containers = Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.source);
                            room_containers = room_containers.concat(Object.keys(Memory.rooms[creep.memory.far_target].energy_flow.containers.other));
                            let full_containers = [];
                            for (let c in room_containers) {
                                let current_container = Game.getObjectById(room_containers[c]);
                                if (current_container && current_container.store[RESOURCE_ENERGY] >= creep.carryCapacity)
                                    full_containers.push(current_container);
                            }
                            transfer_target = creep.pos.findClosestByRange(full_containers);
                        } else {
                            transfer_target = null;
                        }
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
                    if (creep.name === 'worker_E38N48_E38N47-2' ) console.log('[DEBUG][' + creep.name + ']: Build?  avoid_rooms: ' + avoid_rooms + '; my_room.memory.targets.build: ' + my_room.memory.targets.build)
                    if (avoid_rooms && my_room.memory.targets && my_room.memory.targets.build) creep.memory.role = 'build';
                    else {
                        let repair_procent = 0.9;
                        let memory_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : false;
                        let avoid_repair = ['5b6299b65abaee4cd13cefa7',];
                        //object.room.name !== creep.homeland
                        let target2repair = (memory_target && memory_target.hits < memory_target.hitsMax) ? memory_target :
                                          creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: object => ((object.structureType === STRUCTURE_ROAD || object.structureType === STRUCTURE_CONTAINER || object.structureType === STRUCTURE_RAMPART) && 
                                                                                                            object.hits/object.hitsMax < repair_procent)});
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
                        
                        let newRoomPosition = new RoomPosition(25, 25, creep.memory.far_target);
                        switch(room_name) {
                            case 'E32N53':
                                newRoomPosition = new RoomPosition(4, 5, creep.memory.far_target);
                                break;
                            case 'E26N41':
                                newRoomPosition = new RoomPosition(46, 38, creep.memory.far_target);
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
                                let extension_target = ((room_name === 'E32N53' && 
                                                        creep.memory.source_id.indexOf('5b613b019007134cd78dc2dd') >= 0) || 
                                                        (room_name === 'E28N48' && 
                                                        creep.memory.source_id.indexOf('5b34d0a3e6e0fa316db08a31') < 0 && 
                                                        creep.memory.source_id.indexOf('5b45be9f1e189e61e50b576c') < 0)) ? creep.pos.findClosestByPath(FIND_STRUCTURES,
                                                                                {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                                                                                                     && (object.energy < object.energyCapacity))}) : false;
                                if (extension_target) {
                                    current_target = extension_target;    
                                } else {
                                    for (let t in transfer_targets) {
                                        // if (creep.name === 'rmt_hrvst_E32N49_E31N49-1-sp') 
                                        // console.log('[DEBUG][' + creep.name + '] : ROOM: ' + room_name + '; target: ' + transfer_targets[t]);
                                        current_target = Game.getObjectById(transfer_targets[t])
                                        if (((current_target.structureType === 'container' && current_target.store['energy'] < current_target.storeCapacity) ||
                                            ((current_target.structureType === 'link') && current_target.energy < (current_target.energyCapacity * 0.8))) &&
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
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] REMOTE source: ' +  remote_source);
                // if (creep.memory.role === 'harvest' && remote_source.energyAvailable === 0) {
                //     creep.memory.role = 'undefined';
                //     creep.memory.target_id = false;  
                // }
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
                    // else if (my_lab && my_lab.mineralAmount < 0.85*my_lab.mineralCapacity)
                    //     transfer_target = my_lab;
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
                let controller_containers = {
                    'E32N49': Game.getObjectById('5b33639acb21c464f0c933a3'),
                    'E27N41': Game.getObjectById('5b7b9da33b41006a20d49491'),
                }
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']');
                if ((room_name === 'E34N47' || room_name === 'E28N48') && (!withdraw_target || withdraw_target.energy === 0) && my_room.terminal.store[RESOURCE_ENERGY] > 20000) withdraw_target = my_room.terminal;
                if (controller_containers[room_name] && controller_containers[room_name].store.energy >= creep.carryCapacity) withdraw_target = controller_containers[room_name];
                
                if (creep.carry[RESOURCE_ENERGY] === 0) {
                    if (creep.withdraw(withdraw_target, RESOURCE_ENERGY) !== OK) creep.moveTo(withdraw_target, global_vars.moveTo_ops);
                    // if (room_name === 'E34N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: ACT: ' + creep.withdraw(withdraw_target, RESOURCE_ENERGY))
                } else {
                    // if (room_name === 'E34N47') console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: UPGRADE')
                    if (creep.upgradeController(my_room.controller) !== OK) creep.moveTo(my_room.controller, global_vars.moveTo_ops);
                }
                break;
            case 'its_my':
                // let my_new_room = creep.memory.claim_room;
                let my_new_room = 'E34N47';
                let claim_target = new RoomPosition(44, 31, my_new_room);
                console.log('****   CLAIME TARGET: ' + JSON.stringify(claim_target));
                if (creep.pos.isNearTo(claim_target)) {
                    let action_out = creep.claimController(Game.rooms[my_new_room].controller);
                    console.log('****   CLAIME: ' + action_out);
                } else creep.moveTo(claim_target, global_vars.moveTo_ops);
                if (Game.rooms[my_new_room].controller.my) creep.signController(claim_target, "Stay away from unnecessary conflicts :)");
                break;
            case 'energy_helper':
                // let source_target = Game.getObjectById('5acc524f6bec176d808adb71'); // E36N48
                let source_target;
                let cur_destination;
                
                if (!creep.memory.target_id) {
                    if(room_name === 'E38N48' || room_name === 'E38N47') {   // help E38N48 to E38N47
                    // if(room_name === 'E28N48' || room_name === 'E26N48') {   // help E28N48 to E26N48
                    // if(room_name === 'E37N48' || room_name === 'E38N47') {   // help E38N48 to E38N47
                    // if(room_name === 'E37N48' || room_name === 'E36N48') {    // help E36N48 to E37N48
                    // if(room_name === 'E38N48' || room_name === 'E36N48') {    // help E36N48 to E38N48
                        if (creep.carry[RESOURCE_ENERGY] === 0) {
                            // creep.memory.target_id = '5b2cc739f727462af9e9828a';    // Storage E28N48
                            // creep.memory.target_id = '5afd3bd34337e90a8c6d9253';    // Storage E37N48
                            creep.memory.target_id = '5ad024eac27319698ef58448';    // Terminal E38N48
                            // creep.memory.target_id = '5afd6ab8f686ff54854efc5a';    // Storage E38N48
                            // creep.memory.target_id = '5afd9b372c5d4f7e24b2bf4c';    // Storage E36N48
                        } else {
                            // let dst_targets = ['5b8af7829a49221b47f8ac05', ]; // Containers E26N48
                            let dst_targets = ['5b11bf4882c1ef67174cd56e', ]; // Links and storage E38N47
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
            case 'worker':
                let worker_room = creep.name.substring(14, 20);
                let worker_location = new RoomPosition(25, 25, worker_room);
                 // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Location: ' + new_location + '; Range: ' + (creep.pos.getRangeTo(new_location) > 3)) 
                if (creep.pos.getRangeTo(worker_location) > 23) creep.moveTo(worker_location, global_vars.moveTo_ops)
                else {     // Need if creep came with any energy
                // if (room_name === 'E38N47' && creep.pos.y > 2) {     // Need if creep came with any energy
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Change to undefined') 
                    creep.memory.role = 'undefined';
                }
                break;                
            case 'claimer':
                let new_room = 'E37N48';
                let new_location = new RoomPosition(25,25,new_room);
                // let new_location = Game.getObjectById('59f1a4e382100e1594f3db1a');  // controller of E28N48
                // console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Location: ' + new_location + '; Range: ' + (creep.pos.getRangeTo(new_location) > 3)) 
                if (creep.pos.getRangeTo(new_location) > 3) creep.moveTo(new_location, global_vars.moveTo_ops)
                if (room_name === new_room && creep.pos.x < 49) {     // Need if creep came with any energy
                    console.log('[DEBUG] (structCreep.run)[' + creep.name + '] Change to undefined') 
                    creep.memory.role = 'undefined';
                }
                break;
            case 'attacker_constructions':
                for (let s in creep.memory.constructions2attack) {
                    let current_construction = Game.getObjectById(creep.memory.constructions2attack[s]);
                    if (current_construction){
                        console.log('[DEBUG] (structCreep.attacker_constructions)[' + creep.name + '] Const: ' + current_construction.id);
                        if (creep.attack(current_construction) !== OK) creep.moveTo(current_construction)
                        break;
                    } else {
                        creep.moveTo(new RoomPosition(47,22,'E26N48'))
                    }
                }
                break;
            case 'attacker':
                let attacked_room = creep.memory.room_in_war;
                
                // let t = Game.getObjectById('5b4b2d0d364bfc2d1ef2bd6d');
                // if ( creep.heal(t) !== OK) creep.moveTo(t, global_vars.moveTo_ops); 
                // t = Game.getObjectById('5b31d6a07cac973a8f2efb60');
                // if ( creep.attack(t) !== OK ) creep.moveTo(t, global_vars.moveTo_ops); 
                // return
                
                if (room_name !== attacked_room) creep.moveTo(new RoomPosition(25,25, attacked_room), global_vars.moveTo_ops);  
                else {
                    let h = my_room.find(FIND_HOSTILE_CREEPS)   
                    
                    let target2attack = false;
                    console.log('[DEBUG] (structCreep-attacker)('+ room_name + ') Room STATUS: ' + Memory.rooms[room_name].global_vars.status + '; Hostile:' + h.length);
                    if (h.length > 1) { // Created for 2 hostile creeps. one of them is healer
                        let body_map = h[0].body.map(x => x.type);
                        if (body_map.indexOf('heal') > -1 || body_map.indexOf('ranged_attack') > -1) target2attack = h[0];
                        else target2attack = h[1];
                    } else if (h.length === 1) target2attack = h[0]
                    else if (creep.hits < creep.hitsMax) {
                        creep.heal(creep);
                    } else if (Memory.rooms[room_name].global_vars.status ==='war') {
                        Memory.rooms[room_name].global_vars.status = 'peace';
                        // Game.notify('[INFO] (structCreep-attacker)[' + room_name + '][' + creep.name + '] We won on claimed area');
                    } else {
                        let my_creep2heal = creep.pos.findClosestByRange(FIND_MY_CREEPS, {filter: object => (object.hits < object.hitsMax)});
                        // console.log('[DEBUG] (structCreep-attacker): Creep to heal: ' + (my_creep2heal?my_creep2heal.id:0)); 
                        if (my_creep2heal) {
                            if (creep.heal(my_creep2heal) !== OK) creep.moveTo(my_creep2heal);
                        } else {
                            // Game.notify('[INFO] (structCreep-attacker)[' + room_name + '][' + creep.name + '] All creeps are healthy on the room. Bye, Bye');
                            creep.suicide();
                        }
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
