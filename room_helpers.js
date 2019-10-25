var creep_helpers = require('creep_helpers');

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
    // console.log('[DEBUG](room.helpers-link_transfer): Destination link: ' + destination_link)
    let energy_sent = false;
    let dst_missing = destination_link.store.getCapacity() - destination_link.store[RESOURCE_ENERGY];
    
    // if (source_link.id === '5ac80cb1efc817037dc137dd') console.log('[DEBUG](room.helpers-link_transfer): Destination (' + destination_link.id + ') missing energy: ' +  dst_missing + '; Source (' + source_link.id + '): ' + source_link.store[RESOURCE_ENERGY]);
    
    if (source_link.cooldown === 0 && destination_link && dst_missing >= source_link.store[RESOURCE_ENERGY]) {
            source_link.transferEnergy(destination_link, source_link.store[RESOURCE_ENERGY]);
            energy_sent = true;
    }
    return energy_sent;
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

function shuffle(arra1) {
    var ctr = arra1.length, temp, index;

// While there are elements in the array
    while (ctr > 0) {
// Pick a random index
        index = Math.floor(Math.random() * ctr);
// Decrease ctr by 1
        ctr--;
// And swap the last element with it
        temp = arra1[ctr];
        arra1[ctr] = arra1[index];
        arra1[index] = temp;
    }
    return arra1;
}


var room_helpers = {
    define_extension_first: function(room_name) {
        let my_room = Game.rooms[room_name];
        my_room.memory.energy_flow.extension_first = ((my_room.energyCapacityAvailable*0.5) > my_room.energyAvailable);    
    },
    transfer_energy: function(room_name) {
        let my_room = Game.rooms[room_name];
        let cur_terminal_id = Memory.rooms[room_name].energy_flow.terminal;
        let cur_terminal = (cur_terminal_id) ? Game.getObjectById(cur_terminal_id) : false;
        // let destination_rooms = Object.keys(Memory.rooms);
        let destination_rooms = ['E38N47', 'E39N49'];    //
        let send_amount = 2000;

        // console.log('[ERROR](room.transfer_energy)[' +  room_name + '] Destinations rooms: ' + JSON.stringify(destination_rooms));

        if (destination_rooms.indexOf(room_name) >= 0) return;    // Destination room don't send eneregy

        minimal_energy_terminal = {store: {energy: 500000}}
        for (let r in destination_rooms) {
            let destination_terminal = Game.rooms[destination_rooms[r]].terminal;
            // console.log('[DEBUG](room.transfer_energy)[' +  room_name + '] Amount of energy of terminal ' + destination_rooms[r] + ': ' + minimal_energy_terminal.store[RESOURCE_ENERGY]);
            if (destination_terminal && minimal_energy_terminal.store[RESOURCE_ENERGY] > destination_terminal.store[RESOURCE_ENERGY])
                minimal_energy_terminal = destination_terminal
        }

        // console.log('[DEBUG](room.transfer_energy)[' +  room_name + '] Minimal energy terminal: ' + minimal_energy_terminal.room.name);

        let destination_terminal = minimal_energy_terminal
        let destination_room_name = destination_terminal.room.name
        let destination_room = Game.rooms[destination_room_name]
        if (destination_terminal.room && cur_terminal && cur_terminal.cooldown === 0 &&
            destination_terminal.store[RESOURCE_ENERGY] < Memory.rooms.global_vars.terminal_max_energy_storage &&
            cur_terminal.store[RESOURCE_ENERGY] > Memory.rooms.global_vars.terminal_min2transfer &&
            destination_terminal.store[RESOURCE_ENERGY] < destination_room.memory.energy_flow.max_store.terminal &&
            cur_terminal.store[RESOURCE_ENERGY] > (destination_terminal.store[RESOURCE_ENERGY] + send_amount)) {

            let send_out = cur_terminal.send(RESOURCE_ENERGY, send_amount, destination_room_name);
            // console.log('[ERROR](room.transfer_energy)[' +  room_name + '] Send out: ' + send_out)
            if (send_out === OK) {
                console.log('[ERROR](room.transfer_energy)[' +  room_name + '] destination (' + destination_room + '): ' + destination_terminal.store[RESOURCE_ENERGY] + '; source: ' +  cur_terminal.store[RESOURCE_ENERGY]);
            }
            // let storage_emergency_ration = Memory.rooms.global_vars.storage_emergency_ration;
            // let energy2transfer = cur_terminal.store[RESOURCE_ENERGY] - storage_emergency_ration;
            // if (energy2transfer > 2000) energy2transfer = 2000;
            // if (energy2transfer > 1000 && cur_terminal.store[RESOURCE_ENERGY] > 100000) {
            //     cur_terminal.send(RESOURCE_ENERGY, energy2transfer, 'E32N49');
            //     // Game.notify(current_room_name + ' Sent ' +  energy2transfer + ' enegry' + ' To E37N48');
            // }
        }
    },
    is_inside_wall: function(room_name, target) {
        let is_inside = true;
        switch(room_name) {
            // case 'E26N48':
            //     if (target.pos.x < 35 || target.pos.x > 38 || target.pos.y > 36 || target.pos.y < 29) is_inside = false;
            //     break; 
            case 'E27N41':
                if (target.pos.x > 37 || target.pos.x < 8 || target.pos.y < 13 || target.pos.y > 44) is_inside = false;
                break;  
            case 'E27N45':
                if (target.pos.x < 2 || target.pos.x > 30 || target.pos.y > 36 || target.pos.y < 4) is_inside = false;
                break;  
            case 'E28N48':
                if (target.pos.y < 8 || target.pos.y > 38 || target.pos.x < 21) is_inside = false;
                break;
            case 'E32N49':
                if (target.pos.x < 2 || target.pos.x > 46) is_inside = false;
                break;
            case 'E32N53':
                if (target.pos.x > 24 || target.pos.x < 2 || target.pos.y > 43 || target.pos.y < 20) is_inside = false;
                break;  
            case 'E33N47':
                if (target.pos.x < 2) is_inside = false;
                break;
            case 'E34N47':
                if (target.pos.x < 28 || target.pos.y > 34) is_inside = false;
                break;
            case 'E36N48':
                if (target.pos.x < 15 || target.pos.y < 11 || (target.pos.x < 32 && target.pos.y > 38)) is_inside = false;
                break;
            case 'E37N48':
                if (target.pos.x < 12 || target.pos.y < 10) is_inside = false;
                break;  
            case 'E38N47':
                if (target.pos.x < 5 || target.pos.y > 28) is_inside = false;
                break;    
            case 'E38N48':
                if (target.pos.x < 15 || target.pos.y < 19) is_inside = false;
                break;
            case 'E39N49':
                if (target.pos.x > 42 || target.pos.x < 20 || target.pos.y < 16) is_inside = false;
                break;
            }        
        return is_inside;
    },
    transfer_mineral: function(room_name) {
        let all_my_rooms = ['E28N48', 'E33N47', 'E34N47', 'E37N48', 'E38N47', 'E38N48', 'E39N49'];
        let my_rooms_wo_src_room = _.remove(all_my_rooms, function(n) {return n != room_name});

        // if (room_name === 'E33N47') console.log('My Rooms: "' + all_my_rooms + '"')
        let my_room = Game.rooms[room_name];

        let cur_room_terminal = (my_room) ? my_room.terminal : false;
        if (!cur_room_terminal) return;   // The room without my controller or without terminal

        let global_vars = Memory.rooms.global_vars;
        let room_mineral = my_room.memory.energy_flow.mineral.type;

        terminal_minerals = Object.keys(cur_room_terminal.store)
        terminal_minerals.push(my_room.memory.energy_flow.mineral.type)

        // if(room_name === 'E38N48') console.log('[DEBUG] (room_helpers.transfer_mineral): Room: ' + room_name + ';  Terminal minerals: ' + JSON.stringify(terminal_minerals));
        we_have_minreal2transfer = false
        min_amount = ['', 0, '']    // [dst_room_name,amount_of_mineral_in_dst_terminal, mineral]
        for (indx in terminal_minerals) {
            room_mineral = terminal_minerals[indx]
            // if (room_mineral === 'XUH2O') console.log('[DEBUG] (room_helpers.transfer_mineral)[' + room_name + '] ' + room_mineral + ': ' + cur_room_terminal.store[room_mineral] +
            //             '; Limit: ' + (global_vars.minerals.received_room + global_vars.minerals.send_amount) +
            //             '; Don"t Transfer: ' + (cur_room_terminal.store[room_mineral] < (global_vars.minerals.received_room + global_vars.minerals.send_amount)))
            if (room_mineral === 'total' ||
                cur_room_terminal.store[room_mineral] < (global_vars.minerals.received_room + global_vars.minerals.send_amount))// ||
                // room_mineral === 'XUH2O')
                continue
            reagent_rooms = (global_vars.room_by_mineral.reagent[room_mineral]) ? global_vars.room_by_mineral.reagent[room_mineral] : []
            // if (room_name === 'E38N48') console.log('WO source: ' + my_rooms_wo_src_room)
            potential_dst_rooms = (room_mineral.length == 5 || room_mineral === 'GH2O') ? my_rooms_wo_src_room : reagent_rooms
            // if (room_name === 'E38N48') console.log('[DEBUG] (room_helpers.transfer_mineral): Current room: ' + room_name + '; Mineral: ' + room_mineral + '; Poten Rooms' + JSON.stringify(potential_dst_rooms)) // + '; Index: ' + dst_room_index)
            for (let dst_room_index in potential_dst_rooms) {
                let dst_room_name = potential_dst_rooms[dst_room_index];
                let dst_room_terminal = Game.rooms[dst_room_name].terminal
                if (((room_name === 'E34N47' && room_mineral === 'G') || room_mineral.length == 5 || room_mineral == 'GH2O') &&
                    cur_room_terminal.store[room_mineral] > (dst_room_terminal.store[room_mineral] + global_vars.minerals.send_amount) &&
                    (!dst_room_terminal.store[room_mineral] ||
                        dst_room_terminal.store[room_mineral] <= global_vars.minerals.received_room)) {}
                else if (room_name === dst_room_name || !my_room.controller.my ||
                        (my_room.memory.energy_flow.mineral.type != room_mineral && potential_dst_rooms.includes(room_name) &&
                                                                                    potential_dst_rooms.includes(dst_room_name)) ||
                        // Memory.rooms[dst_room_name].energy_flow.mineral.type === room_mineral ||
                        dst_room_terminal.store[room_mineral] > global_vars.minerals.received_room ||
                        cur_room_terminal.store[room_mineral] < global_vars.minerals.send_amount ||
                        cur_room_terminal.cooldown > 0)
                            continue;
                // if(room_name === 'E38N48') console.log('[DEBUG] (room_helpers.transfer_mineral) Mineral [' + room_mineral + ']: ' + cur_room_terminal.store[room_mineral] +'/' + global_vars.minerals.send_amount + ' ; DST [' + dst_room_name + ']: ' + dst_room_terminal.store[room_mineral] + '; Min[' + min_amount[0] + ']: ' +min_amount[1])
                    if (!dst_room_terminal.store[room_mineral] || dst_room_terminal.store[room_mineral] < min_amount[1] || min_amount[0] == '')
                    min_amount = [dst_room_name, dst_room_terminal.store[room_mineral], room_mineral]
                // if (!dst_room_terminal.store[room_mineral] || dst_room_terminal.store[room_mineral] < min_amount[1] || min_amount[0] == '')
                //     min_amount = [dst_room_name, dst_room_terminal.store[room_mineral]]
            }
        }
        // console.log('[DEBUG] (room_helpers.transfer_mineral) Minimum Mineral: ' + JSON.stringify(min_amount))
        if (min_amount[0] != '') {
            we_have_minreal2transfer = true
            let send_out = cur_room_terminal.send(min_amount[2], global_vars.minerals.send_amount, min_amount[0]);
            if (send_out === OK) console.log('[INFO] (room_helpers.transfer_mineral): Sent ' + global_vars.minerals.send_amount +
                ' of ' + min_amount[2] + ' from ' + room_name + ' to ' + min_amount[0]);
            else console.log('[ERROR] (room_helpers.transfer_mineral): FAILED [' + send_out + '] transfer of "' + room_mineral +
                '" from ' + room_name + ' to ' + min_amount[0]);
        }
        // if (!we_have_minreal2transfer) console.log("[INFO] (room_helpers.transfer_mineral)[" + room_name + "]: It's no minerals to transfer")
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
        

        let src_links = my_room.memory.energy_flow.links.near_sources;
        if (my_room && src_links && src_links.length > 0) {
            for (let l in src_links) {
                let current_link = Game.getObjectById(src_links[l]);
                if (current_link && current_link.store[RESOURCE_ENERGY]/current_link.store.getCapacity() < 0.9) {
                    // console.log('[DEBUG] (room_helpers.verify_all_full)[' + room_name + ']: LINK: ' + src_links[l] + ' is empty');
                    all_links_full = false;
                    break;
                }
            }
        }   

        // TOWERS
        let all_towers = Object.keys(my_room.memory.towers.current);
        for (let t in all_towers) {
            let current_tower = Game.getObjectById(all_towers[t]);
            // console.log('[DEBUG] (room_helpers.verify_all_full)[' + room_name + '] Tower: ' + current_tower.id + '; All towers: ' + JSON.stringify(all_towers));
            if (current_tower && current_tower.store[RESOURCE_ENERGY] < 600) {
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

        let source_links = my_room.memory.energy_flow.links.near_sources;
        source_links = source_links.concat(my_room.memory.energy_flow.links.sources)
        for (let l_src in source_links) {
            let current_link_sent = false;
            let source_link = Game.getObjectById(source_links[l_src]);
            if (!(source_link && (source_link.store[RESOURCE_ENERGY] > 100))) continue;
            let destination_links = (my_room.memory.energy_flow.links.near_controller) ? [my_room.memory.energy_flow.links.near_controller,] : [];    // First link to get energy is near controller
            destination_links = destination_links.concat(Object.keys(my_room.memory.energy_flow.links.destinations));
            
            // if ( room_name === 'E32N49') console.log('[ERROR] (room_helpers.transfer_link2link)[' + room_name  +'] Destination Links: ' + JSON.stringify(destination_links));
            
            for (let l_dst in destination_links) {
                let dst_l = Game.getObjectById(destination_links[l_dst]);
                if (source_link && dst_l)
                    current_link_sent = link_transfer(source_link, dst_l);
                if (current_link_sent) break;
            }
            if (current_link_sent) break;
        }
        
        for (let near_src in my_room.memory.energy_flow.links.near_sources) {    // link near source transfer to controller ONLY!!
            let near_source_link = Game.getObjectById(my_room.memory.energy_flow.links.near_sources[near_src]);
            if (!(near_source_link && (near_source_link.store[RESOURCE_ENERGY] > 100))) continue;
            // console.log('[ERROR] (room_helpers.transfer_link2link)[' + room_name  +'] Destination link:' + Game.getObjectById(my_room.memory.energy_flow.links.near_controller))
            let dst_link = Game.getObjectById(my_room.memory.energy_flow.links.near_controller);
            if (near_source_link && my_room.memory.energy_flow.links.near_controller && dst_link)
                link_transfer(near_source_link, dst_link);
        }
    },
    update_labs_info: function(room_name, room_by_mineral) {
        // Containers
        let my_room = Game.rooms[room_name];
        if (!my_room) return; 
        
        let all_labs = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_LAB)});
        let all_labs_ids = all_labs.map(x => x.id);
        let all_lab_flags = my_room.find(FIND_FLAGS, {filter: object => (object.name.split('-')[0] === 'lab' ||
                                                                         object.name.split('-')[0] === 'lab2')});
        let labs_info = {
            lab_per_mineral: {},
            minerals: {
                'reagent': [],
                'produce': [],
                'process': []
            },
            reagent: {},    // The lab contains minerals imported to the room or mined in the room.
            produce: {},    // The lab creates mineral to additional connection with other lab in the room
            process: {},    // The lab creates final mineral of the room
            booster: {}     // The lab is near storage and is used to boost creeps
        };

        let lab_reagent_positions = {};
        let lab_produce_positions = {};
        let lab_process_positions = {};
        let labs_id_by_mineral = {};
        let mineral_by_lab = {};
        let lab_per_mineral = {}

        for (let f in all_lab_flags) {
            let flag_pos_str = all_lab_flags[f].pos.x +'-' + all_lab_flags[f].pos.y;
            let flag_name_splitted = all_lab_flags[f].name.split('-');
            let lab_mineral = flag_name_splitted[1];
            let mineral_stage = flag_name_splitted[2];
            if (mineral_stage === 'reagent')
                lab_reagent_positions[flag_pos_str] = lab_mineral;
            else if (mineral_stage === 'produce') {
                lab_produce_positions[flag_pos_str] = lab_mineral;
                if ((lab_mineral.length == 5) // || lab_mineral === 'GH2O') 
                    && !room_by_mineral.final_produce.includes(lab_mineral))
                    room_by_mineral.final_produce.push(lab_mineral)
            } else if (mineral_stage === 'process')
                lab_process_positions[flag_pos_str] = lab_mineral;
            else
                console.log('[ERROR] (room_helpers.update_labs_info)[' + room_name  +']: ' + all_lab_flags[f].name + ' Doesnt have definition');
        }
        
        for (let l in all_labs) {
            let lab_pos_str = all_labs[l].pos.x + '-' + all_labs[l].pos.y;
            if (Object.keys(lab_reagent_positions).indexOf(lab_pos_str) >= 0 ) {
                labs_info.minerals.reagent.push(lab_reagent_positions[lab_pos_str])
                labs_info.reagent[all_labs[l].id] = {type: lab_reagent_positions[lab_pos_str]};
                labs_id_by_mineral[lab_reagent_positions[lab_pos_str]] = all_labs[l].id;
                mineral_by_lab[all_labs[l].id] = lab_reagent_positions[lab_pos_str];
                lab_per_mineral[lab_reagent_positions[lab_pos_str]] = all_labs[l].id
                add_room_mineral2memory(room_by_mineral, room_name, lab_reagent_positions[lab_pos_str], 'reagent');
            } else if (Object.keys(lab_produce_positions).indexOf(lab_pos_str) >= 0 ) {
                labs_info.minerals.produce.push(lab_produce_positions[lab_pos_str])
                labs_info.produce[all_labs[l].id] = {type: lab_produce_positions[lab_pos_str]};
                labs_id_by_mineral[lab_produce_positions[lab_pos_str]] = all_labs[l].id;
                mineral_by_lab[all_labs[l].id] = lab_produce_positions[lab_pos_str];
                lab_per_mineral[lab_produce_positions[lab_pos_str]] = all_labs[l].id
                add_room_mineral2memory(room_by_mineral, room_name, lab_produce_positions[lab_pos_str], 'produce');
            } else if (Object.keys(lab_process_positions).indexOf(lab_pos_str) >= 0 ) {
                labs_info.minerals.process.push(lab_process_positions[lab_pos_str])
                labs_info.process[all_labs[l].id] = {type: lab_process_positions[lab_pos_str]};
                labs_id_by_mineral[lab_process_positions[lab_pos_str]] = all_labs[l].id;
                mineral_by_lab[all_labs[l].id] = lab_process_positions[lab_pos_str];
                lab_per_mineral[lab_process_positions[lab_pos_str]] = all_labs[l].id
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
        my_room.memory.mineral_by_lab = mineral_by_lab;
        my_room.memory.lab_per_mineral = lab_per_mineral
    },
    upgrade_energy_flow: function(room_name) {
        // Containers
        let my_room = Game.rooms[room_name];
        if (!my_room || !my_room.controller.my) return;
        
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
            store_used: {
                storage: _.sum(my_room.storage.store),
                terminal: _.sum(my_room.terminal.store)
            },
            max_store: my_room.memory.energy_flow.max_store,
            mineral: cur_mineral,
            containers: {source :{}, other: {}}, 
            links: {near_sources: [], near_controller: false, destinations: {}, sources: []}
        }
        // Sort containers
        console.log('[DEBUG] (room_helpers.upgrade_energy_flow)[' + room_name +']')
        if (room_name === 'E28N47' ) console.log('[DEBUG] (room_helpers.upgrade_energy_flow): All Containers: ' + JSON.stringify(all_containers.map(x => x.id)));
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
                        creeps_moving2me: [],
                        miner_id: (my_room.memory.energy_flow.containers.source[all_containers[i].id]) ? my_room.memory.energy_flow.containers.source[all_containers[i].id].miner_id : false
                    };
                    container_defined = true;
                    // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Added Container: ' + all_containers[i].id + '; Source: ' + JSON.stringify(energy_flow_obj));
                    break;
                }
            }
            // console.log('[DEBUG] (room_helpers.upgrade_energy_flow): Container: ' + all_containers[i].id + ' is Defined: ' + container_defined);
            if (!container_defined) local_energy_flow_obj.containers.other[all_containers[i].id] = {creeps_moving2me: []};
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
                local_energy_flow_obj.links.destinations[all_links[l].id] = false;
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
        let hostile_creeps = (my_room) ? my_room.find(FIND_HOSTILE_CREEPS, {filter: object => (creep_helpers.is_millitary(object))}) : [];
                // , {filter: object => (object.owner.username !== 'Sergeev' || (object.owner.username === 'Sergeev' && is_millitary(object)))})
        let invader_core = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_INVADER_CORE)})
                                        
        let most_danger_hostile;
        // if (room_name === 'E39N49') console.log('[DEBUG] (room_helpers-define_room_status)[' + room_name + '] Hostiles: ' + hostile_creeps.length + ' CRNT status: ' + room_vars.status + '; FINISH War/Current time: ' + room_vars.finish_war + ' / ' + Game.time);
        if (room_vars.status === 'peace' && ((hostile_creeps && hostile_creeps.length > 0) || (invader_core && invader_core.length > 0))) {
            room_vars.status = 'war';
            let hostile_boosts = {};
            for(let b in hostile_creeps[0].body) {
                let cur_boost = hostile_creeps[0].body[b].boost;
                if(!hostile_boosts[cur_boost]) hostile_boosts[cur_boost] = 1;
                else hostile_boosts[cur_boost]++;
            }
            avoid_hostiles = ['Invader', ]; //'rogersnape63', 'Kraetzin'];
            let millitary_body = creep_helpers.is_millitary(hostile_creeps[0]);
            if (avoid_hostiles.indexOf(hostile_creeps[0].owner.username) < 0 && millitary_body) Game.notify(room_name + ' is attacked from (' + hostile_creeps[0].pos.x + ',' + hostile_creeps[0].pos.y + '); by ' + hostile_creeps[0].owner.username + '; Body: ' + JSON.stringify(millitary_body));
        } else if (room_vars.finish_war && room_vars.finish_war < Game.time && room_vars.status === 'war') {
            room_vars.status = 'peace';
            room_vars.finish_war = false;
            // Game.notify('[' + room_name + '] It"s time for PEACE');
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
        let targets = Game.rooms[room_name].find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_CONTAINER && (object.store[RESOURCE_ENERGY]/object.store.getCapacity()) > 0.3)});

        //targets.contact()
    },
    get_transfer_target: function(room_name) {
//        let towers = my_room.find(FIND_MY_STRUCTURES, {filter: object => (structureType: STRUCTURE_TOWER && object.store[RESOURCE_ENERGY] < object.store.getCapacity())});
        let my_room = Game.rooms[room_name];
        let targets = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType != STRUCTURE_SPAWN && object.store[RESOURCE_ENERGY] < object.store.getCapacity())});
        //targets.sort((a,b) => a.hits - b.hits);
        // targets.push(my_spawn);
        //if (targets[0]) console.log('[DEBUG] (room_helpers-get_transfer_target): Transfer target type: ' + targets[0].structureType);
        my_room.memory.targets.transfer = targets[0] ? targets[0].id : false;
        return targets[0].id
    },
    get_repair_defence_target: function(room_name) {
        let my_room = Game.rooms[room_name];
        let targets = [];

        if (!my_room) return; // The room contains no controller

        let min_hits = Memory.rooms.global_vars.defence_level;

        repair_only = {
            'E38N49': ['5ae294df600f8573214e7d09', '5ae2f6c68416ac191f939153'], // containers
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
            E39N49_avoid = []
            E38N47_avoid = ['5bf10cb261ef99031f97d884', '5bf10cc8166f13033947d85e', '5bf10cec9be909030411c9f3', '5bf10d03b1f81602f362b550'];
            E28N48_avoid = ['5b628bc03df03010c281a64c', '5b628c0d359a5b585b99ca37', '5b628c231e49e63f6cec41e4', '5b628c293081766dddad14a6', '5b628c301407e03f53c353ca',
                            '5b2beba06a39f839fe4b7b43', '5b2beba310a9471b92ac8652', '5b2beba971b3e77e476e344a', '5b2bebaff727462af9e92a2a',
                            '5b703a9eb44c5d078a0851a4', '5b703a9eb44c5d078a0851a4', '5b703aabc866f7408b947fb5', '5b703ab2a122607be3dafe5e'];
            // E28N48_avoid = ['5d9dbbc016ace500018a2d1f', '5d9dbbb783e1630001168434', '5d9db60b385375000189d6fe', '5d9db60e40c65400014715f5',
            //                 '5d9db60b385375000189d6ff', '5d9db611a45dbe0001b5ad64', '5d9dbb901ece8c0001231c57', '5d9dbb86e0b4fb0001d04945',
            //                 '5d9dbb6f05273d00018b0b26', '5d9db62b085de300017d53f5', '5d9dbb62f5fb9800016f8184', '5d9db638bdcc2a0001291619'];
          
            let avoid_stricts = E39N49_avoid.concat(E38N47_avoid); //, E28N48_avoid);
            

            targets = my_room.find(FIND_STRUCTURES, {filter: object => ((object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_CONTAINER) && 
                                                                        object.hits < min_hits && object.hits < (object.hitsMax * 0.95) && avoid_stricts.indexOf(object.id) === -1)});
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
    },
    get_lab2withdraw: function(room_name) {
        // The function return a lab ID of greates amount of minerals in 'produce' //, 'process'
        // If the amount of greates lab is less than greatest_mineral_amount, then EMPTY string will be returned
        // [ID, mineral]
        let my_room = Game.rooms[room_name];
        greatest_mineral_amount = ['', '']
        greatest_amount = 250
        lab_stages = ['produce'] //, 'process']
        for (current_stage in lab_stages) {
            l_ids = Object.keys(my_room.memory.labs[lab_stages[current_stage]])
            for (l in l_ids){
                current_lab = Game.getObjectById(l_ids[l])
                lab_amount = current_lab.store[current_lab.mineralType]
                // if (room_name === 'E38N48') console.log('[DEBUG] (room_helpers-get_lab2withdraw) Lab Type: ' + current_lab.mineralType + '; Amount: ' + lab_amount + '; Greates amount: ' + greatest_amount)
                if (lab_amount > greatest_amount &&
                    ((my_room.terminal.store[current_lab.mineralType] < Memory.rooms.global_vars.minerals.storage_final_produce) ||
                        !my_room.terminal.store[current_lab.mineralType])
                     // my_room.storage.store[current_lab.mineralType] < Memory.rooms.global_vars.minerals.storage_final_produce)
                    ) {
                        greatest_mineral_amount = [l_ids[l], current_lab.mineralType]
                        greatest_amount = lab_amount
                        // if (room_name === 'E38N48') console.log('[DEBUG] (room_helpers-get_lab2withdraw) Possible transfer: ' + current_lab.mineralType + ' from ' + l_ids[l])
                }
            }
        }
        return greatest_mineral_amount
    },
    create_sources2withdraw: function(room_name) {
        // The function return array with terminal and storage
        // If source doesn't have enough resources it missing from the array
        // {<id>: <mineral>, ...}
        let my_room = Game.rooms[room_name];
        array2withdraw = {}
        sources = ['terminal'] // , 'storage']
        for (src in sources) {
            minerals = my_room.memory.labs.minerals.reagent
            minerals = shuffle(minerals)    // Randomize an order of the minerals

            for (mineral in minerals) {
                if (my_room[sources[src]].store[minerals[mineral]] >= 250) {
                    lab_of_mineral = Game.getObjectById(my_room.memory.lab_per_mineral[minerals[mineral]])
                    free_space = lab_of_mineral.store.getCapacity(lab_of_mineral.mineralType) - lab_of_mineral.store[lab_of_mineral.mineralType]
                    // if (room_name === 'E37N48') console.log('[DEBUG] (room_helpers-create_sources2withdraw)[' + room_name + '] MINERAL: ' +
                    //                                                     minerals[mineral] +'; LAB ID: ' + my_room.memory.lab_per_mineral[minerals[mineral]] +
                    //                                                     '; Lab Free space: ' + free_space)

                    if (free_space > 250) {
                    // if (free_space > 0) {
                        array2withdraw[my_room[sources[src]].id] = [minerals[mineral], free_space]
                        break
                    }
                }
            }
        }
        return array2withdraw
    },
    run_lab_reactions: function(room_name) {
        // Start possible reactions
        // console.log('[' + room_name + '] Trying run reactions on Labs ')
        let my_room = Game.rooms[room_name];
        reactions_labs = ['process', 'produce']
        // if (room_name === 'E34N47') console.log('[DEBUG] (room_helpers-run_lab_reactions): LAB room ' + room_name)
        for (lab_stage in reactions_labs) {
            lab_ids_of_stage = my_room.memory.labs[reactions_labs[lab_stage]]
            for (lab_id in lab_ids_of_stage){
                current_lab = Game.getObjectById(lab_id)
                if (current_lab.cooldown === 0 && current_lab.store[current_lab.mineralType] <= (current_lab.store.getCapacity(current_lab.mineralType) - 5)) {
                    src_lab1 = Game.getObjectById(lab_ids_of_stage[lab_id].reagents[0])
                    src_lab2 = Game.getObjectById(lab_ids_of_stage[lab_id].reagents[1])
                    current_lab.runReaction(src_lab1, src_lab2)
                }
                // else console.log('[' + room_name + '] Lab: ' + lab_id +'; Couldown: ' + current_lab.cooldown)
            }
        }
    },
    get_minerals_status: function() {
        // Put to memory status of all terminals
        // rooms.global_vars.terminal_status
        terminals_status = {}
        store_types = ['terminal', 'storage']
        storage_status_by_mineral = {
            energy: {
                total: 0,
                terminal: {total: 0},
                storage: {total: 0}
            },
            defence: {
                rooms: {}
            },
            store_status: {
                terminal: {},
                storage: {}
            }
        }
        for (m in Memory.rooms.global_vars.room_by_mineral.final_produce) {
            storage_status_by_mineral[Memory.rooms.global_vars.room_by_mineral.final_produce[m]] = {
                total: 0,
                terminal: {total: 0},
                storage: {total: 0}
            }
        }
        for (r in Game.rooms) {
            current_room = Game.rooms[r]
            if (!current_room.controller.my) continue   // The room isn't mine
            terminals_status[r] = {}
            for (store_part in current_room.terminal.store) {
                if (Memory.rooms.global_vars.room_by_mineral.final_produce.includes(store_part) || store_part === 'energy') {
                    storage_status_by_mineral[store_part].terminal[r] = current_room.terminal.store[store_part]
                    storage_status_by_mineral[store_part].terminal.total += current_room.terminal.store[store_part]
                    storage_status_by_mineral[store_part].total += current_room.terminal.store[store_part]
                }
                terminals_status[r][store_part] = current_room.terminal.store[store_part]
            }
            terminals_status[r]['total'] = current_room.memory.energy_flow.store_used.terminal

            for (store_part in current_room.storage.store) {
                if (Memory.rooms.global_vars.room_by_mineral.final_produce.includes(store_part) || store_part === 'energy') {
                    storage_status_by_mineral[store_part].storage[r] = current_room.storage.store[store_part]
                    storage_status_by_mineral[store_part].storage.total += current_room.storage.store[store_part]
                    storage_status_by_mineral[store_part].total += current_room.storage.store[store_part]
                }
            }
            storage_status_by_mineral['defence']['rooms'][r] = current_room.find(FIND_STRUCTURES, {filter: object =>
                                                                (object.structureType === STRUCTURE_RAMPART)})[0]['hits']

            for (store_type in store_types) {
                // console.log('[DEBUG] (room_helpers-get_minerals_status): ' + store_type + ' : ' + JSON.stringify(current_room[store_type]))
                storage_status_by_mineral['store_status'][store_types[store_type]][r] = _.sum(current_room[store_types[store_type]].store)
            }
        }

        Memory.rooms.global_vars.storage_status_by_mineral = storage_status_by_mineral
        Memory.rooms.global_vars.terminal_status = terminals_status
    }
};

module.exports = room_helpers;