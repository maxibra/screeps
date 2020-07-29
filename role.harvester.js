// var spawn_name = 'max';
// var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var room_helpers = require('room_helpers');

var global_vars = Memory.rooms.global_vars;

var RoleHarvester = {
    run: function (creep, iam_general) {
        let target;
        let room_name = creep.room.name;
        let my_room = Game.rooms[room_name];
        let action_out;
        let harvester_type = false;     // needed to use saved id
        let creep_name4log = ''; //'E37N48-1-gn';
        let far_source = Game.getObjectById('59f1a54882100e1594f3e357');
        let close_source = Game.getObjectById('59f1a54882100e1594f3e356');

        // let bad_condition = (creep_name == '')
        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester) [' + creep_name4log +']: ' + JSON.stringify(creep.memory), null, 2);
        
        if (creep.store[RESOURCE_ENERGY] === creep.store.getCapacity()) {
            creep.memory.role = (creep.memory.special) ? creep.memory.special : false;
            creep.memory.harvester_type = false;
            if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (Full) target_id is Changed to false');
            creep.memory.target_id = false;
            return;
        }

        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester) [' + creep_name4log +'] Memory:  ' + JSON.stringify(creep.memory));

        // Here with zero energy. If no enough time to work then die
        // if (creep.ticksToLive < global_vars.age_to_drop_and_die) {
        //     creep.say('Going2die');
        //     creep.suicide();     // Go to die to Cemetery (a far place)
        // }

        if (creep.memory.role !== 'harvest') creep.say('harvesting');

        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] STUCK: ' + creep.memory.stuck +'; Target ID: ' + creep.memory.target_id + '; TYPE: ' + creep.memory.harvester_type);

        let creep_target_id = creep.memory.target_id

        // if (room_name === 'E36N49') {
        //     creep_target_id = '5ac546e4fa53b34bc122178c'
        //     creep.memory.target_id = creep_target_id
        //     harvester_type = 'storage';
        //     creep.memory.harvester_type = harvester_type
        //     target = Game.getObjectById(creep_target_id);
        // }

        if (creep_target_id) {
            target = Game.getObjectById(creep_target_id);
            harvester_type = creep.memory.harvester_type;
            if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester) [' + creep.name +']: Target ID Exist: ' + target.id + '; harvester_type: ' + harvester_type);
            if (creep.ticksToLive <= global_vars.age_to_drop_and_die) {  // Clean booking container or link
                if (target.structureType === 'container') {
                    if (my_room.memory.energy_flow.containers.source[creep_target_id]) {
                        let index = my_room.memory.energy_flow.containers.source[creep_target_id].creeps_moving2me.indexOf(creep.id);
                        if (index > -1) my_room.memory.energy_flow.containers.source[creep_target_id].creeps_moving2me.splice(index, 1);
                    } else {
                        let index = my_room.memory.energy_flow.containers.other[creep_target_id].creeps_moving2me.indexOf(creep.id);
                        if (index > -1) my_room.memory.energy_flow.containers.other[creep_target_id].creeps_moving2me.splice(index, 1);
                    }
                } else if (target.structureType === 'link')
                    my_room.memory.energy_flow.links.destinations[creep_target_id] = false
                creep.say('Going2die');
                creep.suicide();     // Go to die to Cemetery (a far place)
            }
        } else if (creep.pos.isNearTo(far_source)) {
            target = far_source;
            harvester_type = 'source';
        } else {
            target = false;
            let range2link;
            switch (room_name) {
                case 'E28N48':
                case 'E36N49':
                    range2link = 10;
                    break;                
                case 'E33N47':
                case 'E37N48':
                case 'E38N48':
                    range2link = 20;
                    break;
                case 'E34N47':
                    range2link = 4;
                    break;                    
                default: 
                    range2link = 5;
            }
            // **** Containers        
            let room_containers = (my_room.memory.energy_flow) ? Object.keys(my_room.memory.energy_flow.containers.source) : [];
            room_containers = (my_room.memory.energy_flow) ? room_containers.concat(Object.keys(my_room.memory.energy_flow.containers.other)) : [];
    
            let full_containers = [];
            for (let c in room_containers) {
                // console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Container: ' + c + ';Room Containers : ' + JSON.stringify(room_containers[c]));
                let current_container = Game.getObjectById(room_containers[c]);
                let current_length = 0
                if (current_container)
                    current_length = (my_room.memory.energy_flow.containers.source[current_container.id]) ? my_room.memory.energy_flow.containers.source[current_container.id].creeps_moving2me.length
                                                                                                          : my_room.memory.energy_flow.containers.other[current_container.id].creeps_moving2me.length

                let current_container_free_energy = current_container.store[RESOURCE_ENERGY] - (current_length * creep.store.getCapacity())
                // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Current Container : ' + JSON.stringify(current_container.pos) + '; Move2me: ' + current_length + '; Free: ' + current_container_free_energy);
                if (current_container &&
                    (current_container_free_energy >= (creep.store.getCapacity()*0.86) ||
                     (current_container.store[RESOURCE_ENERGY] > 50 && creep.pos.getRangeTo(current_container) < 3)))
                    full_containers.push(current_container);
            }
    
            let room_full_container = creep.pos.findClosestByRange(full_containers);
            // *****************       
            // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +'] Full container: ' + room_full_container)
            let destination_links = (my_room.memory.energy_flow) ? my_room.memory.energy_flow.links.destinations : {};
            if (my_room.controller.level === 8) destination_links[my_room.memory.energy_flow.links.near_controller] = false
            for (let l_id in destination_links) {
                let cur_target = Game.getObjectById(l_id);
                if (cur_target && creep.pos.getRangeTo(cur_target) <= 3 && cur_target.store[RESOURCE_ENERGY] > 0) {
                    target =  cur_target;
                    break;
                }
            }    
            if (target) { // LINK is near me
                harvester_type = 'link';
            } else if (creep.memory.special !== 'upgrader' && room_full_container) { // ||
                    //   (room_name === 'E38N47' && room_full_container && (Game.getObjectById('59f1a59182100e1594f3eb8b').store[RESOURCE_ENERGY] === 0 || Game.getObjectById('5ad6d9528fd8b7520976363f').pos.lookFor(LOOK_CREEPS).length > 0))) {
                target = room_full_container;
                harvester_type = 'container';
                if ( my_room.memory.energy_flow.containers.source[room_full_container.id] ) {
                    my_room.memory.energy_flow.containers.source[room_full_container.id].creeps_moving2me.push(creep.id)
                } else {
                    my_room.memory.energy_flow.containers.other[room_full_container.id].creeps_moving2me.push(creep.id)
                }
                // if (my_room.memory.energy_flow.containers.source[target.id]) {
                //     my_room.memory.energy_flow.containers.source[target.id].screeps_on_way += 1
                // }
            } else { 
                // let destination_links = (my_room.memory.energy_flow) ? my_room.memory.energy_flow.links.destinations : {};
 
                // if (my_room.memory.energy_flow.links.near_controller && Memory.rooms.global_vars.units[room_name].upgrade === 0) 
                //     destination_links[my_room.memory.energy_flow.links.near_controller] = false
                // // let links_room_pos = []
                // for (let l_id in destination_links)
                //     links_room_pos.push(Game.getObjectById(l_id))
                // target = creep.pos.findClosestByRange(links_room_pos, 
                //                                       {filter: object => (object.store[RESOURCE_ENERGY] > 0 &&
                //                                                           creep.pos.getRangeTo(object) <= range2link)})
 
                for (let l_id in destination_links) {
                    let cur_target = Game.getObjectById(l_id);
                    if (cur_target && creep.pos.getRangeTo(cur_target) <= range2link && cur_target.store[RESOURCE_ENERGY] > 0) {
                        target =  cur_target;
                        break;
                    }
                }               
                if (target) {   // LINK
                    harvester_type = 'link';
                    // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: GET LINK: ' + JSON.stringify(target));
                } else {
                    // target = false
                    target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: object => (creep.pos.getRangeTo(object) < 5 || object.energy > 200)});
                    // console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Conditional: DROPPED : ' + !(room_name === 'E38N47' && creep.pos.y > 31));
    
                    if (target && creep.memory.special !== 'upgrader' && room_helpers.is_inside_wall(room_name, target) && room_name !== 'E27N45') {
                     // && !(room_name === 'E38N47' && my_room.memory.global_vars.status === 'war')) { //  && room_name !== 'E38N47') {
                        harvester_type = 'dropped';
                        // my_room.memory.energy_flow.dropped[target.id] = creep.name
                    } else {
                        target = false
                        // target = creep.pos.findClosestByRange(FIND_TOMBSTONES,{filter: object => ((object.store[RESOURCE_ENERGY] > 0 && creep.pos.getRangeTo(object) < 15) || 
                        //                                                                           object.store[RESOURCE_ENERGY] > 200 ||
                        //                                                                           Object.keys(object.store).length === 1)}); //|| creep.pos.getRangeTo(object, 2)});
                        
                        // let min_terminal_storage = (my_room.memory.global_vars.status === 'war') ? 0 : Memory.rooms.global_vars.terminal_emergency_ration;
                        // let min_storage_storage = (my_room.memory.global_vars.status === 'war') ? 0 : Memory.rooms.global_vars.storage_emergency_ration;
                        let min_terminal_storage = 0;
                        let min_storage_storage =  0;
                        if (!my_room.memory.global_vars) return
                        storage_target = null
                        if (!my_room.memory.global_vars.all_full)
                            // storage_target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: object => ((object.structureType === STRUCTURE_STORAGE && (object.store[RESOURCE_ENERGY] > min_storage_storage)) ||
                            //                                                                                   (object.structureType === STRUCTURE_TERMINAL && (object.store[RESOURCE_ENERGY] > min_terminal_storage)))});
                            
                            console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Room: ' + room_name)
                            storage_target = my_room.terminal
                            if (storage_target && storage_target.store[RESOURCE_ENERGY] < min_terminal_storage) {
                                // console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Terminal TARGET: ' + !(storage_target.store[RESOURCE_ENERGY] < min_terminal_storage));
                                storage_target = my_room.storage
                                if (storage_target && storage_target.store[RESOURCE_ENERGY] < min_storage_storage) {
                                    // console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Terminal TARGET: ' + !(storage_target.store[RESOURCE_ENERGY] < min_terminal_storage));
                                    storage_target = false
                                }
                            }
                            
                        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] STORAGE TARGET: ' + storage_target.structureType);

                        // if (target && creep.memory.special !== 'upgrader' && my_room.memory.global_vars.status === 'peace' &&
                        //     room_helpers.is_inside_wall(room_name, target)) {
                        //     console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] TOMBSTONE : ' + target.id);
                        //     harvester_type = 'tombstone';
                        //     // my_room.memory.energy_flow.tombstone[target.id] = creep.name
                        // } else 
                        // console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Define harvest from ; TARGETS: ' + JSON.stringify(storage_target))
                        if (storage_target && my_room.memory.energy_flow[storage_target.structureType] && creep.memory.special !== 'upgrader') {
                            // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Define harvest from ' + storage_target.structureType);

                            harvester_type = 'storage';
                            target = storage_target;
                        } else if (creep.memory.special !== 'upgrader') {
                            target = (creep.memory.target_id) ? creep.memory.target_id : creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE,{filter: object => (object.energy > 60)});
                            harvester_type = 'source';
                            // if (target &&
                            //     room_name === 'E34N47' && target.id === far_source.id && 
                            //     creep.room.lookForAtArea(LOOK_CREEPS,far_source.pos.y-1,far_source.pos.x-3,far_source.pos.y+3,far_source.pos.x, true).length > 0){
                            //         harvester_type = 'go_close';
                            // } else 
                            if (target && 
                                Memory.rooms.global_vars.units[room_name].energy_miner === 0 && 
                                creep.body.filter(x=>x.type==='work').length >= 1) harvester_type = 'source';
                            // else if (creep.room.name == 'E39N49' || creep.room.name == 'E38N48' || creep.room.name == 'E32N49') harvester_type = 'go_close';
                        }
                    }
                }
            }

            if (target) {
                // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (target) Defined to ' + target.id + '; Type: ' + harvester_type);
                creep.memory.target_id = target.id;
                creep.memory.harvester_type = harvester_type;
                if (iam_general) creep.memory.role = 'harvest';   // change role if the creep isn't from special role
            }
        }

        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: HARVESTER Type: ' + harvester_type +'; Target: ' + JSON.stringify(target) + '; AFTER TARGET: ' + JSON.stringify(creep.memory));

        // ACTION
        switch(harvester_type) {
            case 'tombstone':
                console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] TARGET: ' + JSON.stringify(target));
                if (!target) break;
                for (let r in target.store) {
                    let total_carry = _.sum(creep.store);
                    // console.log('[DEBUG] (RoleHarvester)[' + creep.name +']: Carry: ' + total_carry)
                    if (total_carry < creep.store.getCapacity()) action_out = creep.withdraw(target, r);
                    if (action_out === OK && r !== 'energy') creep.memory.has_minerals = true;
                }
            case 'container':
            case 'link':
            case 'storage':
                action_out = creep.withdraw(target, RESOURCE_ENERGY);
                if (action_out === OK) {
                    creep_target_id = target.id
                    if (harvester_type === 'container') {
                        if (my_room.memory.energy_flow.containers.source[creep_target_id]) {
                            let index = my_room.memory.energy_flow.containers.source[creep_target_id].creeps_moving2me.indexOf(creep.id);
                            if (index > -1) my_room.memory.energy_flow.containers.source[creep_target_id].creeps_moving2me.splice(index, 1);
                        } else if (Object.keys(my_room.memory.energy_flow.containers.other) > 0){
                            console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Target: ' + creep_target_id + '; Other containers: ' + JSON.stringify(my_room.memory.energy_flow.containers.other))
                            let index = my_room.memory.energy_flow.containers.other[creep_target_id].creeps_moving2me.indexOf(creep.id);
                            if (index > -1) my_room.memory.energy_flow.containers.other[creep_target_id].creeps_moving2me.splice(index, 1);
                        }
                    } else if (target.structureType === 'link')
                        my_room.memory.energy_flow.links.destinations[creep_target_id] = false
                }
                // creep.memory.role = false;
                // creep.memory.target_id = false;
                // creep.memory.harvester_type = false;
                break;
            case 'source':
                action_out = creep.harvest(target);
                break;
            case 'dropped':
                action_out = creep.pickup(target);
                break;
            case 'go_close':
                let c_id = false;
                switch (creep.room.name) {
                    case 'E39N49': 
                        c_id = '5a99c2e49340d4525da5a48f'
                        break;
                    case 'E38N48':
                        c_id = '5ac622cbbf6cfa17b08c2299';
                        break;
                    case 'E34N47':
                        c_id = '59f1a54882100e1594f3e356';
                        break;
                    case 'E38N47':
                        c_id = '5ae26b147f42c412d14121c1'; // spawn
                        creep.memory.target_id = c_id;
                        // creep.memory.harvester_type = 'link';
                        // break;                        
                    case 'E32N49':
                        c_id = '5b11a21741bb645c4a20e159'; // spawn
                        break;
                    default:
                        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (Default-Go_close) target_id is Changed to false');
                        creep.memory.target_id = false;
                        creep.memory.harvester_type = false;                        
                }
                if (c_id) creep.moveTo(Game.getObjectById(c_id), global_vars.moveTo_ops);
                break;
            default:
                // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (Default-type) target_id is Changed to false');
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
        }
        // if (creep.name === creep_name4log || creep.name === 'E38N47-0-58-110-gn') console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: HARVESTER Type: ' + harvester_type +' ACTION OUT: ' + action_out + '; Target: ' + target.id);
        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] ACTION OUT:' + action_out);
        if (action_out === OK) {
            creep.memory.stuck = 0;

        }
        else if (action_out === ERR_NOT_IN_RANGE) {
            if (creep.pos.getRangeTo(target) <= 3) creep.memory.stuck++;
            creep.moveTo(target, global_vars.moveTo_ops);
            // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: ERR_NOT_IN_RANGE TARGET; STUCk: ' +  creep.memory.stuck + '; Memory: ' + JSON.stringify(creep.memory));
            if (creep.memory.stuck > 5 && !(room_name === 'E34N47' && creep.pos.getRangeTo(Game.getObjectById(close_source)) < 4)) {
                let room_sources = Object.keys(my_room.memory.energy_flow.sources);
                let room_source_containers = my_room.memory.energy_flow.containers.source;
                let next_source = false;
                let next_type;
                for (let c in room_source_containers) {
                    // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] TARGET: ' + target.id + '; Container: ' +  c);
                    if (target.id === room_source_containers[c].source_id) {
                        next_source = c;
                        next_type = 'container';
                        break;
                    }
                }
                if (!next_source) {
                    for (let i in room_sources) {
                        if (target.id === room_sources[i]) continue;
                        next_source = room_sources[i];
                        next_type = 'source';
                    }
                }
                
                // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] NEXT Source: ' + next_source + '; T: ' + next_type);
                
                // if (room_name === 'E32N49' && my_room.controller.pos.findInRange(FIND_MY_CREEPS, 3).length > 1) {
                //     //do nothing
                // } else 
                if (next_source && !(room_name === 'E34N47' && next_source.id === far_source.id &&
                                            creep.room.lookForAtArea(LOOK_CREEPS,far_source.pos.y-1,far_source.pos.x-3,far_source.pos.y+3,far_source.pos.x, true).length > 0)) {
                    // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (next_source) Changed to ' + next_source);
                    creep.memory.target_id = next_source;    
                    creep.memory.harvester_type = next_type;
                } else {
                    // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (!!next_source) Changed to false');
                    creep.memory.target_id = false;
                    creep.memory.harvester_type = 'go_close'
                }
                creep.memory.stuck = 0;
                // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] STUCK: ' + creep.memory.stuck + '; NEXT Source: ' + next_source + '; TYPE: ' + next_type);
            } else { 
                // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] TARGET DOESN"t changed: ' + target.id);
                creep.memory.target_id = target.id;
            }
        } else if (action_out === ERR_INVALID_TARGET) {
            // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (ERR_INVALID_TARGET) target_id is Changed to false');
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        } else if (action_out === ERR_NOT_ENOUGH_RESOURCES || action_out === ERR_FULL) { // && creep.store[RESOURCE_ENERGY] > 0) {
            creep.memory.role = (creep.memory.special) ? creep.memory.special : false;
            // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] (ERR_NOT_ENOUGH_RESOURCES) target_id is Changed to false');
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
            // creep.memory.role = 'transfer';
        }
        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']:' );

        // all source's types with immediate harvesting (pickup, withdraw)
        if (action_out === OK && 
            harvester_type !== 'source' && harvester_type !== 'mineral' && 
            !(harvester_type === 'go_close' && room_name === 'E38N47')) {
            // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep.name +'] Changed to false (immediate harvset). Memory: ' + JSON.stringify(creep.memory));
            creep.memory.role = (creep.memory.special) ? creep.memory.special : false;
            // if (my_room.memory.energy_flow.containers.source[target.id]) {
            //         my_room.memory.energy_flow.containers.source[target.id].screeps_on_way -= 1
            // }
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        }

        // if (creep.store/creep.store.getCapacity() > 0.9 && (Game.creeps.length < Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount])) {     // If it's not enought creeps change to transfer
        //     creep.memory.role = 'transfer';
        //     creep.memory.target_id = false;
        //     creep.memory.harvester_type = false;
        // }
        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: LAST TARGET: ' + JSON.stringify(creep.memory));
    }
}

module.exports = RoleHarvester;