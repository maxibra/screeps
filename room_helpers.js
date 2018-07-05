// var global_vars = require('global_vars')();
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

function get_direction_name(dx, dy) {
    if (dx == 0 && dy < 0) return TOP;
    else if (dx > 0 && dy < 0) return TOP_RIGHT;
    else if (dx < 0 && dy < 0) return TOP_LEFT;
    else if (dx == 0 && dy > 0) return BOTTOM;
    else if (dx > 0 && dy > 0) return BOTTOM_RIGHT;
    else if (dx < 0 && dy > 0) return BOTTOM_LEFT;
    else if (dx > 0 && dy == 0) return RIGHT;
    else if (dx < 0 && dy == 0) return LEFT;
    else return -1;
}

function get_stright_path(FromPos, ToPos) {
    /* Return path left-right or top-bottom
     FromPos, ToPos - RoomPosition (new RoomPosition(spawn_pos.x+1,spawn_pos.y-1,my_room.name))
     Return:
     Path: [{"x":18,"y":24,"dx":1,"dy":-1,"direction":2},
     {"x":18,"y":23,"dx":0,"dy":-1,"direction":1}]
     Empty path if any error has occurred}
     */
    if (typeof FromPos == "undefined" || typeof ToPos == "undefined") return [];
    var startx =  FromPos.x;
    var starty = FromPos.y;
    var endx = ToPos.x;
    var endy = ToPos.y;
    if (FromPos.x > ToPos.x || Frompos.y > ToPos.x) {
        startx =  ToPos.x;
        starty = ToPos.y;
        endx = FromPos.x;
        endy = FromPos.y;
    }
    var stright_path = [];
}

function is_millitary(creep_obj) {
    let millitary_types = ['attack','ranged_attack','heal','claim'];
    let body_types = _.map(creep_obj.body,'type');
    let millitary_creep = false;
    for(let i in millitary_types)
        if (body_types.indexOf(millitary_types[i]) > 0) {
            millitary_creep = true;
            break;
        }
    return millitary_creep;
}

function link_transfer(source_link, destination_link) {
    if (destination_link && (destination_link.energy/destination_link.energyCapacity < 0.9)) {
            let dst_missing = destination_link.energyCapacity - destination_link.energy;
            let energy2transfer = ((dst_missing < source_link.energy) ? dst_missing : source_link.energy);
            source_link.transferEnergy(destination_link, energy2transfer);
    }    
}

function get_mineral_reagents(mineral) {
    let reagents = false;
    let splitted;
    
    if ( mineral === 'G' ) {
        reagents = ['ZK', 'UL'];
    } else if ( mineral.length === 2 ) {
        reagents = mineral.split('');
    } else if ( mineral.length === 4 ) {
        splitted = mineral.split('2');
        if ( splitted[0].length === 2 )
            reagents = [splitted[0], 'OH'];
        else if ( splitted[0].length === 3 )
            reagents = [splitted[0][0] + 'O', 'OH'];
    } else if ( mineral.length === 5 ) {
        splitted = mineral.split('X');
        if ( splitted[1].length === 4 )
            reagents = [splitted[1], 'X'];
    }
    
    if ( !reagents )
        console.log('[ERROR](room.helpers-get_mineral_reagents): "' + mineral + '" Is unknown mineral; Reagents: ' + reagents);
    
    return reagents;
}

function add_room_mineral2memory(new_room_by_mineral, room_name, mineral, lab_phase) {
    if (!new_room_by_mineral[lab_phase][mineral])
        new_room_by_mineral[lab_phase][mineral] = [room_name,];
    else if (new_room_by_mineral[lab_phase][mineral].indexOf(room_name) < 0)
        new_room_by_mineral[lab_phase][mineral].push(room_name);
    console.log('[ERROR](room.helpers-add_room_mineral2memory)[' +  room_name + '] mineral: ' + mineral + '; phase: ' + lab_phase + '; room_by_mineral: ' + JSON.stringify(new_room_by_mineral));
}


var room_helpers = {
    transfer_mineral: function(room_name) {
        let my_room = Game.rooms[room_name];
        
        let cur_room_terminal = (my_room) ? my_room.terminal : false;
        if (!cur_room_terminal) return;   // The room without my controller or without terminal
        
        let global_vars = Memory.rooms.global_vars;
        let room_mineral = my_room.memory.energy_flow.mineral.type;
        
        // console.log('[DEBUG] (room_helpers.transfer_mineral): Room: ' + room_name + '; Terminal: ' + cur_room_terminal);
        
        for (let dst_room_index in global_vars.room_by_mineral.reagent[room_mineral]) {
            let dst_room_name = global_vars.room_by_mineral.reagent[room_mineral][dst_room_index];
            if (room_name === dst_room_name || Memory.rooms[dst_room_name].energy_flow.mineral.type === room_mineral ||
                Game.rooms[dst_room_name].terminal.store[room_mineral] > global_vars.minerals.received_room ||
                cur_room_terminal.store[room_mineral] < global_vars.minerals.send_amount ||
                cur_room_terminal.cooldown > 0)       
                    continue;
            let send_out = cur_room_terminal.send(room_mineral, global_vars.minerals.send_amount, dst_room_name);
            if (send_out === OK) console.log('[INFO] (room_helpers.transfer_mineral): Sent ' + global_vars.minerals.send_amount + ' of ' + room_mineral + ' from ' + room_name + ' to ' + dst_room_name);
            else console.log('[ERROR] (room_helpers.transfer_mineral): FAILED [' + send_out + '] transfer from ' + room_name + ' to ' + dst_room_name);
            
        }
    },
    check_create_miner: function(room_name, spawn_name, units) {
        let my_room = Game.rooms[room_name];
        let my_spawn = Game.spawns[spawn_name];
        let cur_creeps = Game.creeps ? Game.creeps : {};
        let exist_miners = {};
        let create_miner = false;   // ID of container that need a new creep
        for (let creep_name in cur_creeps) {
            if (units[room_name][cur_creeps[creep_name].memory.role] == 'miner')
                if (typeof exist_miners[cur_creeps[creep_name].memory.container] === 'undefined')
                    if (cur_creeps[creep_name].ticksToLive < my_room.memory.global_vars.age_to_recreate_miner) {
                        create_miner = cur_creeps[creep_name].memory.container_id;
                        break;
                    } else exist_miners[cur_creeps[creep_name].memory.container] = true;
        }

        console.log('[DEBUG] (room_helpers.check_create_miner): create_miner: ' + create_miner);

        if (create_miner) {
            // Do nothing
        } else {// Check if no miners exist
            let containers_w_miners = Object.keys(exist_miners);
            let source_containers = Object.keys(my_room.memory.energy_flow.containers.source);
            for (let ci=0;ci<source_containers.length;ci++) {
                console.log('[DEBUG] (room_helpers.check_create_miner): Container: ' + source_containers[ci] + '; Total: ' + Object.keys(my_room.memory.energy_flow.containers.source));
                if (!containers_w_miners.includes(source_containers[ci])) {
                    create_miner = source_containers[ci];
                    break;
                }
            }
        }
        my_spawn.memory.general['create_miner'] = create_miner;
    },
    verify_all_full: function(room_name) {
        let all_full = true;
        let all_links_full = true;
        let all_towers_full = true;
        let all_extensions_full = true;
        let is_no_constructions = true;
        let my_room = Game.rooms[room_name];

        if (!my_room) return; // The room contains no controller
        
        // LINKS
        // dstn_links = my_room.memory.energy_flow.links.destinations;
        // if (my_room && dstn_links && dstn_links.length > 0) {
        //     for (let l in dstn_links) {
        //         let current_link = Game.getObjectById(dstn_links[l]);
        //         if (current_link && current_link.energy/current_link.energyCapacity < 0.9) {
        //             // console.log('[DEBUG] (room_helpers.verify_all_full)[' + room_name + ']: LINK: ' + dstn_links[l] + ' is empty');
        //             all_links_full = false;
        //             break;
        //         }
        //     }
        // }   

        // TOWERS
        let all_towers = Object.keys(my_room.memory.towers.current);
        for (let t in all_towers) {
            let current_tower = Game.getObjectById(all_towers[t]);
            if (current_tower.energy < 600) {
                all_towers_full = false;
                break;
            }     
        }
            
        // Extensions
        if (my_room.energyAvailable < my_room.energyCapacityAvailable) all_extensions_full = false;
        // console.log('[DEBUG] (room_helpers.verify_all_full)[' + room_name + ']: All Full: ' + (!all_extensions_full || !all_links_full || !all_towers_full) + '; Ext: ' + all_extensions_full + '; Links: ' + all_links_full + '; Towers: ' + all_extensions_full);

        // Build constaructions
        if (my_room.memory.targets.build && my_room.memory.targets.build.length > 0) is_no_constructions = false;
        
        my_room.memory.global_vars.all_full = (!all_extensions_full || !all_links_full || !all_towers_full || !is_no_constructions) ? false : true;
    },
    transfer_link2link: function(room_name) {
        let my_room = Game.rooms[room_name];
        if (!my_room) return; // The room contains no controller
        for (let near_src in my_room.memory.energy_flow.links.near_sources) {    // link near source transfer to controller ONLY!!
            let near_source_link = Game.getObjectById(my_room.memory.energy_flow.links.near_sources[near_src]);
            if (!(near_source_link && (near_source_link.energy > 100))) continue;
            link_transfer(near_source_link, Game.getObjectById(my_room.memory.energy_flow.links.near_controller))
        }
        
        for (let l_src in my_room.memory.energy_flow.links.sources) {
            source_link = Game.getObjectById(my_room.memory.energy_flow.links.sources[l_src]);
            if (!(source_link && (source_link.energy > 100))) continue;
            let destination_links = [my_room.memory.energy_flow.links.near_controller,];    // First link to get energy is near controller
            destination_links = destination_links.concat(my_room.memory.energy_flow.links.destinations);
            
            // if ( room_name === 'E32N49') console.log('[ERROR] (room_helpers.transfer_link2link)[' + room_name  +'] Destination Links: ' + JSON.stringify(destination_links));
            
            for (let l_dst in destination_links) {
                destination_link = Game.getObjectById(destination_links[l_dst])
                if (destination_link && (destination_link.energy/destination_link.energyCapacity < 0.9)) {
                    let dst_missing = destination_link.energyCapacity - destination_link.energy;
                    let energy2transfer = ((dst_missing < source_link.energy) ? dst_missing : source_link.energy);
                    source_link.transferEnergy(destination_link, energy2transfer);
                }
                if (source_link.energy < 100) break;
            }
        }
    },
    update_labs_info: function(room_name, room_by_mineral) {
        // Containers
        let my_room = Game.rooms[room_name];
        if (!my_room) return; 
        
        let all_labs = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LAB)});
        let all_labs_ids = all_labs.map(x => x.id);
        let all_lab_flags = my_room.find(FIND_FLAGS, {filter: object => (object.name.split('-')[0] === 'lab')});
        let labs_info = {
            reagent: {},
            produce: {},
            process: {},
            booster: {}
        };

        let lab_reagent_positions = {};
        let lab_produce_positions = {};
        let lab_process_positions = {};
        let labs_id_by_mineral = {};
        
        for (let f in all_lab_flags) {
            let flag_pos_str = all_lab_flags[f].pos.x +'-' + all_lab_flags[f].pos.y;
            let flag_name_splitted = all_lab_flags[f].name.split('-');
            let lab_mineral = flag_name_splitted[1];
            let mineral_stage = flag_name_splitted[2];
            if (mineral_stage === 'reagent') 
                lab_reagent_positions[flag_pos_str] = lab_mineral;
            else if (mineral_stage === 'produce')
                lab_produce_positions[flag_pos_str] = lab_mineral;
            else if (mineral_stage === 'process')
                lab_process_positions[flag_pos_str] = lab_mineral;
            else
                console.log('[ERROR] (room_helpers.update_labs_info)[' + room_name  +']: ' + all_lab_flags[f].name + ' Doesnt have definition');
        }
        
        for (let l in all_labs) {
            let lab_pos_str = all_labs[l].pos.x + '-' + all_labs[l].pos.y;
            if (Object.keys(lab_reagent_positions).indexOf(lab_pos_str) >= 0 ) {
                labs_info.reagent[all_labs[l].id] = {type: lab_reagent_positions[lab_pos_str]};
                labs_id_by_mineral[lab_reagent_positions[lab_pos_str]] = all_labs[l].id;
                add_room_mineral2memory(room_by_mineral, room_name, lab_reagent_positions[lab_pos_str], 'reagent');
            } else if (Object.keys(lab_produce_positions).indexOf(lab_pos_str) >= 0 ) {
                labs_info.produce[all_labs[l].id] = {type: lab_produce_positions[lab_pos_str]};
                labs_id_by_mineral[lab_produce_positions[lab_pos_str]] = all_labs[l].id;
            } else if (Object.keys(lab_process_positions).indexOf(lab_pos_str) >= 0 ) {
                labs_info.process[all_labs[l].id] = {type: lab_process_positions[lab_pos_str]};
                labs_id_by_mineral[lab_process_positions[lab_pos_str]] = all_labs[l].id;
            } else if (all_labs[l].pos.getRangeTo(my_room.storage) < 5) {
                labs_info.booster[all_labs[l].id] = {type: all_labs[l].mineralType};
            } else
                console.log('[ERROR] (room_helpers.update_labs_info)[' + room_name  +']: The lab ' + all_labs[l].id + ' (' + lab_pos_str + ') Doesnt have definition: ' + all_labs[l].pos.getRangeTo(my_room.storage));
        }
        
        // if (room_name === 'E39N49') console.log('[DEBUG] (room_helpers.update_labs_info)[' + room_name  +'] LABS by mineral: ' + JSON.stringify(labs_id_by_mineral));
        // Define reagent for produce and process
        let prod_labs = Object.keys(labs_info.produce);
        for (let pl in prod_labs) {
            let mineral_reagents = get_mineral_reagents(labs_info.produce[prod_labs[pl]]['type']);
            // if (room_name === 'E39N49') console.log('[DEBUG] (room_helpers.update_labs_info)[' + room_name  +']: LAB ' + prod_labs[pl] + '; Reargents: ' + mineral_reagents); 
            labs_info.produce[prod_labs[pl]]['reagents'] = [labs_id_by_mineral[mineral_reagents[0]], labs_id_by_mineral[mineral_reagents[1]]];
        }
        let process_labs = Object.keys(labs_info.process);
        for (let pl in process_labs) {
            let mineral_reagents = get_mineral_reagents(labs_info.process[process_labs[pl]]['type']);
            // if (room_name === 'E39N49') console.log('[DEBUG] (room_helpers.update_labs_info)[' + room_name  +']: LAB ' + process_labs[pl] + '; Reargents: ' + mineral_reagents); 
            labs_info.process[process_labs[pl]]['reagents'] = [labs_id_by_mineral[mineral_reagents[0]], labs_id_by_mineral[mineral_reagents[1]]];
        }
        
        my_room.memory.labs = labs_info;
    },
    upgrade_energy_flow: function(room_name) {
        // Containers
        let my_room = Game.rooms[room_name];
        if (!my_room) return;
        
        let all_containers = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_CONTAINER)});
        let all_continers_ids = all_containers.map(x => x.id);
        let all_links = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LINK)});
        let all_links_ids = all_links.map(x => x.id);
        let all_sources = my_room.memory.energy_flow.sources;
        let energy_flow_obj = my_room.memory.energy_flow;
        let cur_mineral = (my_room.memory.energy_flow.mineral) ? my_room.memory.energy_flow.mineral : {};
        let local_energy_flow_obj = {
            long_harvest: my_room.memory.energy_flow.long_harvest,
            sources: my_room.memory.energy_flow.sources,
            mineral: cur_mineral,
            containers: {source :{}, other: {}}, 
            links: {near_sources: [], near_controller: false, destinations: [], sources: []}
        }
        // Sort containers
        // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): All Containers: ' + JSON.stringify(all_containers.map(x => x.id)));
        for (let i = 0; i < all_containers.length; i++) {
            let container_defined = false;
            // if (all_containers[i].pos.getRangeTo(my_room.controller) < 5) {
            //     local_energy_flow_obj.containers.controller[all_containers[i].id] = my_room.controller;
            //     container_defined = true
            // } else {
            for (let j = 0; j < all_sources.length; j++) {
                if (all_containers[i].pos.isNearTo(Game.getObjectById(all_sources[j]))) {
                    
                    local_energy_flow_obj.containers.source[all_containers[i].id] = {
                        source_id: all_sources[j],
                        miner_id: (my_room.memory.energy_flow.containers.source[all_containers[i].id]) ? my_room.memory.energy_flow.containers.source[all_containers[i].id].miner_id : false
                    };
                    container_defined = true;
                    // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Added Container: ' + all_containers[i].id + '; Source: ' + JSON.stringify(energy_flow_obj));
                    break;
                }
            }
            // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Container: ' + all_containers[i].id + ' is Defined: ' + container_defined);
            if (!container_defined) local_energy_flow_obj.containers.other[all_containers[i].id] = false;
        }

        // Links
        // *** LOG
        // console.log('[DEBUG](room_helpers.upgrade_energy_flow)[' + room_name + ']: All links: ' + all_links.length + 'Local obj:' + JSON.stringify(local_energy_flow_obj));

        let all_flags = my_room.find(FIND_FLAGS, {filter: object => (object.name.substring(0,4) === 'link')});
        let link_src_positions = [];
        let link_dst_positions = [];
        for (let f in all_flags)
            if (all_flags[f].name.substring(0,8) === 'link_src') link_src_positions.push(all_flags[f].pos.x +'-' + all_flags[f].pos.y);
            else link_dst_positions.push(all_flags[f].pos.x +'-' + all_flags[f].pos.y);

        let range2near_source = (room_name === 'E32N49') ? 1 : 8;
        for (let l in all_links) {
            // if (room_name == 'E38N48') console.log('[DEBUG](room_helpers.upgrade_energy_flow)[' + room_name + ']: LINK: ' + all_links[l].id);
            let link_pos_str = all_links[l].pos.x + '-' + all_links[l].pos.y;
            if (link_src_positions.indexOf(link_pos_str) >= 0) {
                let is_near_source = false;
                for (let s in my_room.memory.energy_flow.sources) {
                    if (all_links[l].pos.getRangeTo(Game.getObjectById(my_room.memory.energy_flow.sources[s])) < range2near_source) {   // Range 8 is for E39N49
                        local_energy_flow_obj.links.near_sources.push(all_links[l].id);
                        is_near_source = true;
                        break;
                    }
                }
                if (!is_near_source) local_energy_flow_obj.links.sources.push(all_links[l].id);
            } else if (all_links[l].pos.getRangeTo(my_room.controller) < 6)
                local_energy_flow_obj.links.near_controller = all_links[l].id;
            else
                local_energy_flow_obj.links.destinations.push(all_links[l].id);
        }
        // if (room_name == 'E38N48') console.log('[DEBUG](room_helpers.upgrade_energy_flow)[' + room_name + ']: DST LINKS iD: ' + JSON.stringify(local_energy_flow_obj.links.destinations));
            
         // check EXTRACTOR in the room
        let extractor_targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_EXTRACTOR)});
        // console.log('[DEBUG](room_helpers.upgrade_energy_flow)[' + room_name + ']: LOCAL FLOW: ' + JSON.stringify(local_energy_flow_obj)) 
        local_energy_flow_obj.mineral.extractor = (extractor_targets.length > 0 && extractor_targets.length > 0) ? extractor_targets[0].id : false;
        
        // check STORAGE in the room
        let storage_targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_STORAGE)});
        local_energy_flow_obj.storage = (storage_targets.length > 0  && storage_targets.length > 0) ? storage_targets[0].id : false;
             
        // check TERMINAL in the room
        let terminal_targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TERMINAL)});
        local_energy_flow_obj.terminal = (terminal_targets.length > 0  && terminal_targets.length > 0) ? terminal_targets[0].id : false;
  
        my_room.memory.energy_flow = local_energy_flow_obj;
    },
    define_room_status: function(room_name) {
        let room_vars = Memory.rooms[room_name].global_vars;
        let global_vars = Memory.rooms.global_vars;
        let my_room = Game.rooms[room_name];
        let hostile_creeps = (my_room) ? my_room.find(FIND_HOSTILE_CREEPS, {filter: object => (object.owner.username !== 'Sergeev' || 
                                                                                                            (object.owner.username === 'Sergeev' && is_millitary(object)))}) :
                                         [];
        let most_danger_hostile;
        // if (room_name === 'E39N49') console.log('[DEBUG] (room_helpers-define_room_status)[' + room_name + '] Hostiles: ' + hostile_creeps.length + ' CRNT status: ' + room_vars.status + '; FINISH War/Current time: ' + room_vars.finish_war + ' / ' + Game.time);
        if (hostile_creeps && hostile_creeps.length > 0 && room_vars.status === 'peace') {
            room_vars.status = 'war';
            let hostile_boosts = {};
            for(let b in hostile_creeps[0].body) {
                let cur_boost = hostile_creeps[0].body[b].boost;
                if(!hostile_boosts[cur_boost]) hostile_boosts[cur_boost] = 1;
                else hostile_boosts[cur_boost]++;
            }
            Game.notify(room_name + ' is attacked from (' + hostile_creeps[0].pos.x + ',' + hostile_creeps[0].pos.y + '); by ' + hostile_creeps[0].owner.username + '; Body: ' + JSON.stringify(hostile_boosts));
        } else if (room_vars.finish_war && room_vars.finish_war < Game.time && room_vars.status === 'war') {
            room_vars.status = 'peace';
            room_vars.finish_war = false;
            Game.notify('[' + room_name + '] It"s time for PEACE');
        } else if (room_vars.status === 'war' && (room_name === 'E32N47' || room_name === 'E32N48')) {
            if(hostile_creeps.length > 0 && !room_vars.finish_war) {    // need the if here for logical flow
                console.log('[DEBUG] (room_helpers-define_room_status): Hostiles: ' + hostile_creeps.length + '; FINISH WAR: ' +  (Game.time + hostile_creeps[0].ticksToLive) + '; Current time: ' + Game.time + '; Hostile life: ' + hostile_creeps[0].ticksToLive);
                room_vars.finish_war = (hostile_creeps.length > 0) ? (Game.time + hostile_creeps[0].ticksToLive - 20) : room_vars.finish_war; 
            }
        } else if (room_vars.status === 'war' && !room_vars.finish_war) {
            room_vars.finish_war = Game.time + global_vars.update_period.after_war;
            // console.log('[DEBUG] (define_room_status)[' + room_name + '] Define finish war to ' +  (Game.time + global_vars.update_period.after_war));
        }
    },
    get_energy_source_target: function(room_name) {
        let targets = Game.rooms[room_name].find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_CONTAINER && (object.store/object.storeCapacity) > 0.3)});

        //targets.contact()
    },
    get_transfer_target: function(room_name) {
//        let towers = my_room.find(FIND_MY_STRUCTURES, {filter: object => (structureType: STRUCTURE_TOWER && object.energy < object.energyCapacity)});
        let my_room = Game.rooms[room_name];
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType != STRUCTURE_SPAWN && object.energy < object.energyCapacity)});
        //targets.sort((a,b) => a.hits - b.hits);
        // targets.push(my_spawn);
        //if (targets[0]) console.log('[DEBUG] (room_helpers-get_transfer_target): Transfer target type: ' + targets[0].structureType);
        my_room.memory.targets.transfer = targets[0] ? targets[0].id : false;
        return targets[0].id
    },
    get_repair_defence_target: function(room_name) {
        let my_room = Game.rooms[room_name];
        let targets = [];
        // let min_hits = 1000000;
        let min_hits = 200000;
        
        if (!my_room) return; // The room contains no controller

        repair_only = {
            'E38N49': ['5ae294df600f8573214e7d09', '5ae2f6c68416ac191f939153'], // containers
            // 'E38N48': ['5ae2f286456b3d0ea1c6f1b4', '5ae2fac36abb293c4600d1a1',  // containers
            //           '5aa0bee77ad634646aa08a49', '5ab39a6b04e7f14b97aa3056', '5ab39a586e59881daa1eb094', '5ab39a827ad7de1dd176d6db',
            //           '5aa0befa7d8eb10a43e101d3', '5aa0bef30f678357d2601767', '5ab39ab7e7f5aa102de370ac', '5ab39ad233287758623d625e', '5ab39aed8e83a870b36a81e5',
            //           '5ac72c64c769531bae38da9b', '5ac7589eb96a887ad73984a6'],
            // 'E34N47': ['5ae3634ad3967d39624771d0',  // container 
            //           '5acc6089c5bb62037cc61e14',  // rampart
            //           '5accf67195d45e308db882e7', '5a97231c4283e76ef6df150c', '5a972319ffa70134f8d01414',
            //           '5a974acf34a154567c596a8c', '5a974ad2117e0f568f21505c', '5a974ad4fc8a790fee2caba9', '5acc6089c5bb62037cc61e14'],
                    //   '5ae4c7fac34576097c19c154', '5ae4c7fd02a75a3c6822ce58', '5ae4c7ff2f4e6a3253b01575', '5ae4c8022a35133912bfc0d4', '5ae4c80571f07c317036f407', '5ae4c80ad0b67f3944d4a6dd',
                    //   '5ae4ef5ea3702131094b5a3d', '5ae4ef631b3cfa3938b84eb2', '5ae4ef61156cc6326b475f16'],
            'E38N47': ['5b080c5e7969af3e3c15dadd', // containers
                       '5adfd2e9baf8e72a189f6fe3', // rampart
                       '5ae0226a28fc8b0ef2d9319c', '5ae01fd32442e73df79d657a',
                       '5add07ddfae3986d75b339d6', '5add07d8b1c4fa2d23056648', '5add07d225e73b0d635afacf', '5add07cd8f560c0d75852114', '5add07c7e95c2c6b701bf6f0',
                       '5add07ada5ea876b7607732c', '5adfd13d53d7a60a47637765',
                       '5b081c9ada8a5f144621fc44', '5b0820cbaad0b67499d90c15', '5adfa6dacec9320ea3313f20', '5adfa6757675f2458c829bb8', '5adfa670d4212c457030d842',
                       '5adfa66a0409f23c73cf2996', '5adfa6652da4b40a5fab775d', '5ae8da39e7e0f042c805233b',
                       '5adfbbb899d2c03c36ead47a', '5adfbbbada0f976c5c1f8d02', '5add8406b21f98456a04e9cc', '5add0790b260d40d64a01627', '5adfde9c60a36d2a01d07ea7']
        }
        // *** LOG
        // console.log('[DEBUG] (room.helpers.get_repair_defence_target)[' + room_name + '] Repair_only: ' +  repair_only[room_name]);

        if (repair_only[room_name]) {
            for(let id in repair_only[room_name]) {
                cur_target = Game.getObjectById(repair_only[room_name][id])
                // console.log('[DEBUG] (room.helpers.get_repair_defence_target)[' + room_name + '] Current: ' +  repair_only[room_name][id]);
                if (cur_target && cur_target.hits < min_hits && cur_target.hits < cur_target.hitsMax) targets.push(cur_target)
            }
        } else {
            E36N48_avoid = ['5ae499b6b0db053c306741a2', '5ae6227e71f07c31703786a8', // rampart to remove
                            '5ae4629ee028fc11d5592552', '5ae46283a200d042b659d71d', '5ae4627cee797138fa78382d', '5ae46281e028fc11d559253f', '5ae4629b4390a242a4bc145d',
                            '5ae45d6506014c098e685a0f', '5ae45d401b3cfa3938b80d92', '5ae45d3e71f07c317036c511', '5ae45d39b4f57132597200b0',
                            '5ae45d33d24b6b325f9b070a', '5ae45d19e028fc11d55922a3', '5ae45cfea4d90142c2bce1d8', '5ae45ce3de930e393efcb67d',
                            '5ae9d96afa9ab031264eabb1', '5ae9d96ccf93c9315d28ac4a', '5ae9d96f3d1c9711c21bfbf0', '5ae9d9724390a242a4be64dc', '5ae9d97fa4d90142c2bf30fd', '5ae9d994d7b511312ddf3f8c',
                            '5ae45b908a126e099a685b12', '5ae45b8a592d9e11a5f6658b', '5ae45c372995ea326511ee7e', '5ae45b88687bce3c31603d7d', '5ae45c3cc34576097c198f6a', '5ae45b85a2505b11b19d3d04',
                            '5ae45b469a54d8394f5ec9de', '5ae45bbffad40139450c63ac', 
                            '5ae445b966b757327b80fd05', '5ae445beee797138fa782b36', '5ae447b21687e93115abe670', '5ae447afd0b67f3944d46c80', '5ae447adcb5e3209ac04526b' , '5ae447aae028fc11d5591807'];
            E34N47_avoid = ['5a975264eb51b07607843a07', '5acc6c9859930d6d93bf843d', '5a975253f5f37e593a6612a2', '5acc61a5af3bc77aef2f50c1', '5a9b3b98dfaa79680d2d2152', '5a97524d3a577b75cbf6b83a', '5a97524d3a577b75cbf6b83a', // Northout
                            '5a98aaa9fd5e170305c61bfc', '5a98aaa5ed8b961cea137744', '5acc619f905a7a18609b2196', '5a98aaaf5f5a69093a23b73c', '5acc6214612b937ab09ee415', '5a98aabc9081677f2e16d808', '5a98aac16cca98531f152d54', // Northin
                            '5acc6d718583106d2d0df104', '5aa70ac88c782b6131a5f33a', '5aa70ad185818e2c8c35d088', '5aa70ad73e59533e668b5b9f', '5aa70add541fda14aeaadf9b', '5aa70ada02a93f3e72865e4e', '5aa70ace1536552c96f7ff0e'];
            E38N47_avoid = ['5ae407d5d24b6b325f9ae11c', '5ae407d74390a242a4bbea7d', '5ae407da99d2c03c36ecc68b', '5ae407dd8a126e099a683326', '5ae407df6922543906ffce2d',
                            '5ae407e2687bce3c31601686', '5ae4090ae78e533c7ff2cb9a', '5ae4085602a75a3c682277dc', '5ae40859e78e533c7ff2cb5f', '5ae4085ce35d18395c3a1388',
                            '5ae4085ee35d18395c3a138c', '5ae4086361b7a5318563af54', '5ae408691b3cfa3938b7e5dc', '5ae4086e2f4e6a3253afc0ab', '5ae40873de930e393efc8ebc',
                            '5add084b4b4b0e4d1132d67b', '5add084e25e73b0d635afb06', '5add08512c04dc6d3c9fa52e', '5add085cc65975451efc2b80'];

            E38N48_avoid = ['5ac7589eb96a887ad73984a6'];    // South rampart will be removed
            E39N49_avoid = []
            E37N48_avoid = [] // ['5abc9c2488988449d6f1d066', '5abc9261ce03634b9a5884de']
            let avoid_stricts = E39N49_avoid.concat(E38N48_avoid);
            avoid_stricts = avoid_stricts.concat(E37N48_avoid);
            avoid_stricts = avoid_stricts.concat(E34N47_avoid);
            avoid_stricts = avoid_stricts.concat(E38N47_avoid);
            avoid_stricts = avoid_stricts.concat(E36N48_avoid);

            targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_CONTAINER) && (object.hits < min_hits && object.hits < (object.hitsMax*0.65)) && avoid_stricts.indexOf(object.id) === -1});
        }
        // console.log('[DEBUG] (get_repair_defence_target)[' + room_name +']: targets: ' + JSON.stringify(targets));
        targets.sort((a,b) => a.hits - b.hits);
//        console.log('[DEBUG] (get_repair_defence_target): targets: ' + JSON.stringify(targets));
        my_room.memory.targets.repair_defence = targets[0] ? targets[0].id : false;
    },
    get_repair_civilianl_target: function(room_name) {
        let my_room = Game.rooms[room_name];
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => !(object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax});
        targets.sort((a,b) => a.hits - b.hits);
        my_room.memory.targets.repair_civilian = targets[0] ? targets[0].id : false;
    },
    get_build_targets: function(room_name) {
        // Extensions have highest priority
        let my_room = Game.rooms[room_name];
        if (!my_room) return; // the room contains no controller
        // if (room_name === 'E33N47') console.log('[DEBUG] (get_build_targets)[: ' + room_name + '; OBJ: ' + JSON.stringify(my_room));
        // let targets = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});
        targets = [];
        // Defence structures are secondary priority
        // console.log('[DEBUG] (get_build_targets)[: ' + room_name + '] Before find');
        if (targets.length === 0) targets = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: object => (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER)});
        // All other structures
        if (targets.length === 0) targets = my_room.find(FIND_MY_CONSTRUCTION_SITES);

        // if (room_name === 'E33N47') console.log('[DEBUG] (get_build_targets)[: ' + room_name + '; TARGETS: ' + JSON.stringify(targets));
        // if (room_name === 'E36N48') console.log('[DEBUG](get_build_targets)[: ' + room_name + '; TARGETS: ' + JSON.stringify(targets));

        targets_id = [];
        for (let i in targets) targets_id.push(targets[i].id);
        // my_room.memory.targets.build = (targets.length > 0) ? targets[0].id : false;
        // if (room_name === 'E33N47') console.log('[DEBUG] (room_helpers.get_build_targets)[: ' + room_name + '] ; TARGETS length: ' + targets_id.length + '; TARGETS: ' + JSON.stringify(targets_id));
        my_room.memory.targets.build = (targets_id.length > 0) ? targets_id : false;
    },
    clean_memory: function() {
        // Clean died creeps
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('[INFO] Clean memory: non-existing creep', name);
            }
        }
    },
    create_extensions: function() {
        var extensions_available = CONTROLLER_STRUCTURES.extension[my_room.controller.level];
        var extensions2add = extensions_available - my_spawn.memory.general.extensions;
        // console.log('[DEBUG] (create_extensions): Extensions to add: ' + extensions2add);
        // var extensions = my_room.find(FIND_MY_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_EXTENSION}});  // building extensions
        // extensions = extensions.concat(my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}})); // ready extensions
        var spawn_pos = my_spawn.pos;
        var y_pos = spawn_pos.y;

        if (extensions2add == 0) return;    // it's no extension to create

        console.log('[INFO] (create_extensions): Start to create a new ' + extensions2add + ' extensions')
        let sx = 0;
        let sy = 0;
        let extensions_rows = 1;
        let add_road_above = false;
        let add_road_below = false;
        let added_extensions = 0;

        switch (my_room.controller.level) {
            case 2:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y+1;
                add_road_above = true;
                break;
            case 3:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y+2;
                add_road_below = true;
                break;
            case 4:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y-2;
                extensions_rows = 2;
                add_road_above = true;
                break;
            case 5:
                sx = spawn_pos.x-1;
                sy = spawn_pos.y+5;
                extensions_rows = 2;
                add_road_below = true;
                break;         }

        console.log('{DEBUG] (create_extensions): X-top:' + sx + '; Y-right:' + sy + '; Road above: ' + add_road_above  + '; below: ' + add_road_below);

        // Create road above if needed
        if (add_road_above) {
            for (var x=sx;x>sx-6;x--) {
                var exit_code = Game.rooms[global_vars.room_name].createConstructionSite(x, sy-1, STRUCTURE_ROAD);
                console.log('[DEBUG] (create_extensions): Create a road above: ' + exit_code);
            }
        }
        // Create extansions
        console.log('[DEBUG](create_extensions): y= ' + (sy+extensions_rows-1));
        for (var y=sy;y<(sy+extensions_rows);y++) {
            for (var x=sx;x>sx-5;x--) {
                var exit_code = Game.rooms[global_vars.room_name].createConstructionSite(x, y, STRUCTURE_EXTENSION);
                console.log('[DEBUG](create_extensions): Creation of extension (' + x + ',' + y + '): ' + exit_code);
                if (exit_code == OK) added_extensions++;
            }
        }
        my_spawn.memory.general.extensions = Game.spawns[global_vars.spawn_name].memory.general.extensions + added_extensions;

        // Create road below if needed
        if (add_road_below) {
            for (var x=sx;x>sx-6;x--) {
                var exit_code = Game.rooms[global_vars.room_name].createConstructionSite(x, sy+extensions_rows, STRUCTURE_ROAD);
                console.log('[DEBUG] (create_extensions): Create a road below: ' + exit_code);
            }
        }
    },
    create_road: function(FromPos, ToPos, p2pPath) {
        /* FromPos, ToPos - RoomPosition with additional keys of 'id' and 'structureType' (use  _.extend(pos, {id: 11111, structureType: xxxxx}))
         p2pPath        - Optional. if given use it instead search a new one
         Return values:
         -1 : FromPos or ToPos is "undefined"
         -2 : the requested road is exist
         */
        if (typeof FromPos == "undefined" || typeof ToPos == "undefined") return -1;

        current_roads = my_room.memory.roads;
        var road_descriptor = FromPos.structureType + FromPos.id.substring(1,4) + '-' + ToPos.structureType + ToPos.id.substring(1,4);

        if (typeof current_roads.find(x => x == road_descriptor) != "undefined") return -2; // Exit if road exists
        var path2target = (p2pPath ? p2pPath : my_room.findPath(FromPos, ToPos, {ignoreCreeps: true}));
        console.log('[INFO] (room_helpers-create_road): Create road From ' + FromPos.structureType + FromPos.id + ' (' + FromPos.x + ', ' + FromPos.y + ')' +
            ' To ' + ToPos.structureType + ToPos.id + ' (' + ToPos.x + ', ' + ToPos.y + ')' + ' Range: ' + path2target.length);
        var xy_path = [];
        for (i in path2target) {
            var p = path2target[i];
            var create_res = my_room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
            if (create_res < 0) console.log('Failed to create');
            else console.log('STATUS: ' + JSON.stringify(my_room.lookAt(p.x, p.y)));
            xy_path.push([p.x, p.y]);
            //get_struct_obj(p.x, p.y);
        }
        //console.log('PATH: ' + JSON.stringify(xy_path));
        var current_roads = my_room.memory.roads;
        current_roads.push(road_descriptor);
        my_room.memory.roads = current_roads;
        return xy_path;
    }
};

module.exports = room_helpers;