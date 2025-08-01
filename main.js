var roleStructCreep = require('role.struct_creep');
var creep_helpers = require('creep_helpers');
var room_helpers = require('room_helpers');
var roleTower = require('struct.tower');
var screepsplus = require('screepsplus');

// rms = Object.keys(Game.rooms); rms.forEach((r) => {console.log(r + " " + (JSON.stringify(Game.rooms[r].terminal) && JSON.stringify(Game.rooms[r].terminal.store.getFreeCapacity())) + "; " + (JSON.stringify(Game.rooms[r].terminal) && JSON.stringify(Game.rooms[r].terminal.store['G'])))})
// Game.rooms['E28N48'].terminal.send('G', 10000, 'E38N49')
// Game.rooms['E33N47'].terminal.send('U', 5000, 'E28N48')
// Game.rooms['E38N47'].terminal.send('Z', 5000, 'E28N48')
// Game.rooms['E39N49'].terminal.send('K', 5000, 'E28N48')

// Game.rooms['E37N48'].nuker.launchNuke(new RoomPosition(20,31, 'E39N48'));
// Game.rooms['E36N48'].nuker.launchNuke(new RoomPosition(20,31, 'E39N48'));
// Game.rooms['E36N49'].nuker.launchNuke(new RoomPosition(20,31, 'E39N48'));
// Game.rooms['E34N47'].nuker.launchNuke(new RoomPosition(20,31, 'E39N48'));
// Game.rooms['E33N47'].nuker.launchNuke(new RoomPosition(22,33, 'E39N48'));
// Game.rooms['E29N47'].nuker.launchNuke(new RoomPosition(22,33, 'E39N48'));

// VER 1.29

// for (r of ['E27N47', 'E27N49', 'E28N47', 'E32N47']) { console.log(r + ': ' + _.map(Game.rooms[r].find(FIND_STRUCTURES, {filter: object => object.structureType === STRUCTURE_WALL}), 'hits').sort(function(a, b){return a - b;}))}
// Game.getObjectById('5f643a04f804ec60fd95b9d7').moveTo( Game.getObjectById('5f64033e8ef676155e3751b5'))

// Game.creeps['max_new-1'].moveTo(Game.getObjectById('5ad024eac27319698ef58448'))
// Game.spawns['E37N48'].spawnCreep([CLAIM,MOVE,MOVE,MOVE], 'its_my', {memory: {role: 'its_my'; target_pos: {x: 39, y:30, roomName: 'E38N47'}}});

function initiate_rooms_global_vars() {
    if (typeof Memory.rooms.global_vars === "undefined") {
        Memory.rooms.global_vars = {
            spawns_list: [],
            critical_controller_percent: 0.5,
            min_tower_enrg2repair: 0.6,
            defence_level: 40554000,
            defence_level_remote: 1300000,
            terminal_max_energy_storage: 170000,
            terminal_min2transfer: 70000,
            terminal_emergency_ration: 80000,
            storage_max_energy: 400000,
            storage_emergency_ration: 300000,
            update_period: {
                towers: 1000,
                after_war: 20
            },
            age_to_drop_and_die: 20,
            moveTo_ops: {
                reusePath: 15,           // default: 5
                //serializeMemory: false, // default: true
                //noPathFinding: true, // default: false
                visualizePathStyle: {
                    fill: 'transparent',
                    stroke: '#fff',
                    lineStyle: 'dashed',
                    strokeWidth: .15,
                    opacity: .1
                }
            },
            update_period: {
                after_war: 150,
                towers: 1000
            },
            room_by_mineral: {
                reagent: {},
                produce: {},
                final_produce: {}
            },
            minerals: {
                send_room: 40000,
                received_room: 1000,
                storage_final_produce: 5000,
                send_amount: 500,
                transfer_batch: 300
            },
            units: {},
            towers: {
                current: {},
                next_update: 10332455
            },
            targets: {},
            minimal_container_energy: 1300
        }
    }
}
function initiate_spawn() {
    for (var current_spawn_name in Game.spawns) {
        // console.log('[DEBUG] (main)[' + current_spawn_name + ': INITIAL: ' + JSON.stringify(Game.spawns[current_spawn_name].memory.general));
        if (typeof Game.spawns[current_spawn_name].memory.general === "undefined") {
            Game.spawns[current_spawn_name].memory.general = {
                gen: 0,
                index: 0,
                status: 'peace',
                extensions: 0
            };
        }
    }
}

let init_avoid_rooms = [];
// let only_rooms = ['E27N47', 'E27N48', 'E28N47', 'E28N48', 'E32N47', 'E33N47', 'E34N47', 'E37N48', 'E37N49', 'E38N47', 'E38N48', 'E38N49', 'E39N49']; //, 'E32N49'];
let only_rooms = ['E27N48'];

// for(var current_room_name in only_rooms) {
function initiate_room_memory(current_room_name) {
    // Initialie the room memory
    if (current_room_name === 'global_vars' ||
        init_avoid_rooms.indexOf(current_room_name) >= 0) return;
    console.log('[DEBUG] (main)[' + current_room_name + ': INITIAL Global: ' + JSON.stringify(Memory.rooms[current_room_name]));

    if (Memory.rooms[current_room_name] && typeof Memory.rooms[current_room_name].towers === "undefined") {
        console.log('[DEBUG] (main)[' + current_room_name + ': INITIAL TOWERS')
        Memory.rooms[current_room_name].towers = {
            current: {},
            next_update: Game.time,
        }
    }

    if (Memory.rooms[current_room_name] && typeof Memory.rooms[current_room_name].targets === "undefined") {
        Memory.rooms[current_room_name].targets = {};
    }

    if (Game.rooms[current_room_name] && Memory.rooms[current_room_name] &&
        typeof Memory.rooms[current_room_name].energy_flow === "undefined") {
        console.log('[DEBUG] (main)[' + current_room_name + '] INIT energy_flow');
        Memory.rooms[current_room_name].energy_flow = {
            sources: Game.rooms[current_room_name].find(FIND_SOURCES).map(x => x.id).reduce((a,b)=> (a[b]=[],a),{}),
            mineral: {
                id: Game.rooms[current_room_name].find(FIND_MINERALS).map(x => x.id)[0],
                type: Game.rooms[current_room_name].find(FIND_MINERALS).map(x => x.mineralType)[0],
                extractor: false
            },
            dropped: {},
            tombstone: {},
          BUCKET: {near_sources: [], near_controller: [], sources: [], destinations: []},
            containers: {
                source: {},
                other: {}
            },
            store_used: {},
            max_store: {
                storage: 1000,
                terminal: 1000
            }
        }
    };

    // if(current_room_name === 'E27N47') console.log('[DEBUG] (main)[' + current_room_name + ': INITIAL Global: ' + JSON.stringify(Memory.rooms[current_room_name]));
    if (Memory.rooms[current_room_name] && typeof Memory.rooms[current_room_name].global_vars === "undefined") {
        Memory.rooms[current_room_name].global_vars = {
            status: 'peace',
            finish_war: false,
            age_to_drop_and_die: 20,
            age_to_recreate_miner: 70,
            max_body_cost: 1800,
            screeps_max_amount: {
                peace: 10,
                war: 30,
                repair_defence: 30,
                build: 15,
                nominal: 15
            },
            creep_types: {
                war: {
                    transfer: 0.3,     // max percentage of transfer from total creeps. index is romm's level
                    build: 0.6,        // max percentage of builders from total creeps
                    repair_defence: 0.4,          // max percentage of repair units from total creeps
                    repair_civilian: 0.2,          // max percentage of repair units from total creeps
                    special_carry: 0.3,
                    harvest: {
                        energy: 0.7,
                        mineral: 0.3
                    }
                },
                peace: {
                    transfer: 0.4,     // max percentage of transfer from total creeps. index is romm's level
                    build: 0.3,        // max percentage of builders from total creeps
                    repair_defence: 0.1,          // max percentage of repair units from total creeps
                    repair_civilian: 0.1,          // max percentage of repair units from total creeps
                    special_carry: 0.4,
                    harvest: {
                        energy: 0.7,
                        mineral: 0.3
                    }
                }
            }
        }
    }
}
// console.log('Creeps general: ' + JSON.stringify(spawn.memory.general));

// JSON.stringify(obj)

// var global_vars = Game.rooms[room_name].memory.global_vars;
// var my_spawn = Game.spawns[global_vars.spawn_name];
// var my_room = Game.rooms[global_vars.room_name];

function get_struct_obj(x, y) {
    var stuctures = global_vars.my_room.lookAt(x,y);
    console.log('XY: ' + x + '-' +y + '; STRUCT: ' + JSON.stringify(stuctures));
    for (var s in stuctures) console.log(stuctures[s]);
}


module.exports.loop = function () {
    // act_out = Game.rooms['E38N47'].controller.activateSafeMode()
    // console.log('[DEBUG] (main): SafeMode: ' + act_out)
    var units = {};
// 59f1a59182100e1594f3eb84
    //console.log('[DEBUG] (main): MAX Creeps: ' + JSON.stringify(Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount));
    var cur_creeps = Game.creeps ? Game.creeps : {};

    let only_rooms = ['E27N47', 'E27N48', 'E27N49', 'E28N47', 'E28N49', 'E28N48', 'E29N47', 'E29N49', 'E32N47', 'E33N47', 'E34N47', 'E36N48', 'E36N49', 'E37N47', 'E37N48', 'E37N49', 'E38N47', 'E38N48', 'E38N49', 'E39N49']; //, 'E32N49'];
    // let only_rooms = []
    let avoid_rooms = ['global_vars', 'E26N40', 'E26N43', 'E26N44', 'E26N46', 'E27N40', 'E29N47', 'E30N48', 'E31N53', 'E34N46', 'E39N50', 'E40N49'];

    let run_on_roooms = (only_rooms.length > 0) ? only_rooms : Object.keys(Memory.rooms);
    let rare_time_range = 300;  // 15 minutes

    // console.log('[INFO] (main)[Before CREEP ---] Creeps: ' + Object.keys(Game.creeps))
    // console.log('[INFO] (main)[Before CREEP ---] Creeps: ' + Object.keys(Game.creeps).length + '; CPU Used: ' + Game.cpu.getUsed().toFixed(2) + '; Ticket Limit: ' + Game.cpu.tickLimit)

    // console.log('[INFO] (main)[Before units ---] CPU Used: ' + Game.cpu.getUsed().toFixed(2) + '; Ticket Limit: ' + Game.cpu.tickLimit)
    if (Game.time % 10 === 0) {
        units['total'] = 0;
        for(let room_index in run_on_roooms) {
            let current_room_name = run_on_roooms[room_index]
            if (current_room_name === 'global_vars') continue
            units[current_room_name] = {
                'total': 0,
                'transfer': 0,
                'build': 0,
                'upgrade': 0,
                'upgrader': 0,
                'repair_defence': 0,
                'repair_civilian': 0,
                'harvest': 0,
                'undefined': 0,
                'long_harvest': 0,
                'claimer': 0,
                'mineral_miner': 0,
                'energy_miner': 0,
                'sp_total': 0,
            };
            // the upgrade doesn't work on not my rooms
            if (Game.time % (5*rare_time_range) === 0) {
            // if (Game.time % 10 === 0) {
                // console.log('[INFO] (main) [' + current_room_name + '] upgrade_energy')
                room_helpers.upgrade_energy_flow(current_room_name);

                // Uncomment if you have a new room or build a new spawn
                // initiate_room_memory(current_room_name);
                // initiate_spawn()

                // my_room = Game.rooms[current_room_name]
                // if (!(my_room && my_room.controller &&
                //         (my_room.controller.my || (my_room.controller.reservation &&
                //                                 my_room.controller.reservation.username === 'maxibra')))) {
                //     console.log('[INFO] (main) [' + current_room_name + '] DELETE')
                //     delete Memory.rooms[current_room_name]
                // }

            }
            // Clean dirty memory
            // Memory.rooms[current_room_name].energy_flow.containers.source = {}
        }
        let creeps_amount = 0
        for (let creep_name in cur_creeps) {
            creeps_amount = creeps_amount + 1;

            // cur_creeps[creep_name].memory.stuck = 0;
            let creep_carry = Object.keys(cur_creeps[creep_name].store);
            splited_name = creep_name.split('-');
            let room_name = cur_creeps[creep_name].room.name;
            if (run_on_roooms.indexOf(room_name) < 0) continue;

            // console.log('[INFO] (main)[' + creep_name + '] Room: ' + room_name + '; Units: ' + JSON.stringify(units))
            units[room_name][cur_creeps[creep_name].memory.role]++;
            units[room_name]['total']++;
            if (cur_creeps[creep_name].memory.special) {units[room_name]['sp_total']++;}
            units['total']++;

            // console.log('[INFO] (main)[After CREEP ' + creep_name + '] CPU Used: ' + Game.cpu.getUsed().toFixed(2) + '; Ticket Limit: ' + Game.cpu.tickLimit)
        }
        Memory.rooms.global_vars.units = units
    } else {
        units = Memory.rooms.global_vars.units;
    }
    // console.log('[INFO] (main)[After UNITS ----] CPU Used: ' + Game.cpu.getUsed().toFixed(2) + '; Ticket Limit: ' + Game.cpu.tickLimit)

    console.log('[INFO] (main): ******** TIME: ' + Game.time + '; BUCKET: ' + Game.cpu.bucket + '  **************');

    if (Game.time % 5 === 0) {
        for (let cur_room in Game.rooms) {
            // console.log('[INFO] (main) ROOM: ' +  cur_room);
            if (!(Memory.rooms[cur_room] && Memory.rooms[cur_room].global_vars)) continue;
            let room_status = Memory.rooms[cur_room].global_vars.status;
            // if (units[cur_room])
            //     console.log('[INFO] (main): [' + cur_room + '][' + room_status + '] expected: ' +
            //                 Memory.rooms[cur_room].global_vars.screeps_max_amount[room_status] +
            //                 '; Workers: ' + (units[cur_room].total-units[cur_room].sp_total-units[cur_room].harvest) + '; ' +
            //                 '; Special: ' + units[cur_room].sp_total + '; ' +
            //                 JSON.stringify(units[cur_room]));
        }
    }
    let tick_between_hard_actions = 2;

    // Every tick loops

    // // LABS
    // dst_lab = Game.getObjectById('5affad40f31bc37e0463fa8b');
    // frst_src =  Game.getObjectById('5afd6e3e17ef266afcaf8a41');
    // scnd_src =  Game.getObjectById('5afe7e3f7d58336918d464a1');

    // if (dst_lab.store[dst_lab.mineralType] < 0.9*dst_lab.store.getCapacity(dst_lab.mineralType)  && frst_src.store[frst_src.mineralType] > 0 && scnd_src.store[scnd_src.mineralType] > 0) dst_lab.runReaction(frst_src, scnd_src);

    // Creeps
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        let cpu_before = Game.cpu.getUsed()
        // if (creep.room.name === 'E28N48') creep.memory.source_id = ['5b2fd3f9c656780b1fee6911',];

        // if ( name === 'E34N47-2-6-110-gn') {
        //     let my_terminal = Game.getObjectById('5adea2c316b2ab2a2a2b472f');
        //     if (creep.transfer(my_terminal, 'GO') !== OK) creep.moveTo(my_terminal);
        //     continue;
        // }

        var creep_role = creep.memory.role
        roleStructCreep.run(creep, units);
        let cpu_used = (Game.cpu.getUsed() - cpu_before).toFixed(2)
        if (cpu_used > 1 ) console.log('Creep: ' + name + ": " + cpu_used)

        if (Game.time % 25 === 0 && Object.keys(creep.store).length === 1) creep.memory.has_minerals = false;
    }
    console.log('[INFO] (main)[After CREEPS RUN] CPU Used: ' + Game.cpu.getUsed().toFixed(2) + '; Creeps: ' + Object.keys(Game.creeps).length + '; Ticket Limit: ' + Game.cpu.tickLimit)


    // // SPAWNS
    // if (Game.time % 8 === 0) {
    //     for(var current_spawn_name in Game.spawns) {
    //         if (run_on_roooms.indexOf(Game.spawns[current_spawn_name].room.name) < 0) continue;
    //         // console.log('[DEBUG](main)[' + current_spawn_name +']: Trying to create creep');
    //         creep_helpers.create_creep(current_spawn_name, units);
    //     }
    // }
    let current_spawn_name = Memory.rooms.global_vars.spawns_list.shift();
    // console.log('[DEBUG] Spawn: ' + current_spawn_name)
    if (Memory.rooms.global_vars.spawns_list.length === 0)
        Memory.rooms.global_vars.spawns_list = Object.keys(Game.spawns);
    creep_helpers.create_creep(current_spawn_name, units);


    let room_by_mineral = {
        reagent: {},
        produce: {},
        final_produce: []
    };
    // console.log('[DEBUG] ROOM: ' + run_on_roooms)

    // Global config builders
    if (Game.time % 10 === 0) {
        room_helpers.find_terminal_min_energy();
    }

    for(var room_index in run_on_roooms) {
        let current_room_name = run_on_roooms[room_index];
        let my_room = Game.rooms[current_room_name];

        if(current_room_name === 'global_vars' || !my_room) continue
        // if(avoid_rooms.indexOf(current_room_name) > -1 ||
        //    only_rooms.indexOf(current_room_name) < 0 ||
        //    !my_room) {
        //     console.log('[DEBUG] (main)[' + current_room_name + '] Skip the room')
        //     continue
        // }
        // if (current_room_name === 'E27N48') Memory.rooms[current_room_name].towers.current = {}
        // Memory.rooms[current_room_name].global_vars.max_body_cost = 2000

        // if(my_room.memory.energy_flow && my_room.memory.energy_flow.max_store) my_room.memory.energy_flow.max_store.terminal_energy = 175000
        // if (Memory.rooms[current_room_name].energy_flow && Memory.rooms[current_room_name].energy_flow.max_store && Memory.rooms[current_room_name].energy_flow.max_store.terminal_max_energy_storage) delete Memory.rooms[current_room_name].energy_flow.max_store.terminal_max_energy_storage
        // if (current_room_name === 'E29N47') Memory.rooms[current_room_name].energy_flow.containers.other = {};
        // delete Memory.rooms[current_room_name].energy_flow.max_used;
        // if (current_room_name === 'E27N48') Memory.rooms[current_room_name].energy_flow.max_store = {storage: 800000, terminal: 270000}

        // room_containers = (my_room.memory.energy_flow && my_room.memory.energy_flow.containers) ? Object.keys(my_room.memory.energy_flow.containers.source) : [];
        // console.log('[DEBUG] (main)[' + current_room_name + '] Containers: ' + room_containers)
        // for (let c of room_containers) {
        //     console.log('[DEBUG] (main)[' + current_room_name + '] Container: ' + c)
        //     my_room.memory.energy_flow.containers.source[c].miner_id = false
        // }

        // if (current_room_name === 'E38N49') Memory.rooms[current_room_name].energy_flow.containers.source = {
        //     "6688e75274915f566f1fd210": {
        //       "source_id": "59f1a59182100e1594f3eb83",
        //       "creeps_moving2me": [],
        //       "miner_id": false
        //     },
        //     "6688f5e5808c277189f6b0e3": {
        //       "source_id": "59f1a59182100e1594f3eb84",
        //       "creeps_moving2me": [],
        //       "miner_id": false
        //     }
        //   }


        // console.log('[DEBUG] ROOM: ' + current_room_name)
        // if (current_room_name === 'E28N48') {
        //     Memory.rooms[current_room_name].global_vars.screeps_max_amount = {
        //         peace: 2,
        //         war: 2
        //     }
        // }

        // delete Memory.rooms[current_room_name].targets.tombstones
        // Memory.rooms[current_room_name].targets.creep_repair_defence = false
        // console.log('[DEBUG] ROOM: ' + current_room_name)

        // Memory.rooms[current_room_name].targets.creep_repair_defence = [];

        // Update max body cost
        // Memory.rooms[current_room_name].global_vars.max_body_cost = 1700

        // Update ALL lab_assistent_needed
        // Memory.rooms[current_room_name].global_vars.screeps_max_amount.lab_assistent_needed = false

        // Towers
        if (!Memory.rooms[current_room_name].global_vars) {
            console.log('[WARN][' + current_room_name +']: global_vars doesnt defined for the room. Skip the room');
            continue;
        }
        let towers_list = (Memory.rooms[current_room_name].towers) ? Object.keys(Memory.rooms[current_room_name].towers.current) : {};
        let towers_energy_full = true;
        // if(current_room_name == 'E27N47') console.log('[DEBUG] (main)[' + current_room_name + ']: TOWERS: ' + JSON.stringify(towers_list) + '; Units: ' + units[current_room_name].total);
        if ((units[current_room_name] && units[current_room_name].total >= 1) || Memory.rooms[current_room_name].global_vars.status === 'war')
            for (let i=0;i<towers_list.length;i++) {
                // console.log('[DEBUG] (main)[' +current_room_name+': TOWER[' + i + ']' + ' ID: ' + towers_list[i]);
                roleTower.run(towers_list[i], units[current_room_name].total-units[current_room_name].sp_total);
            }

        if (Game.time % 2 === 0) {
        }

        if (Game.time % 5 === 0) {
            // console.log('[INFO] (main): RUN 5 tickets functions. Time: ' + Game.time);
            // room_helpers.check_create_miner(current_room_name, global_vars.spawn_name, units);
            if (my_room.memory.targets) room_helpers.find_mycreeps_to_heal(current_room_name);
            room_helpers.transfer_link2link(current_room_name);
        }

        if (Game.time % 5 === 0 && Game.cpu.bucket > 8000) {
            // if (current_room_name === 'E39N49') console.log('[INFO] (main)[' +current_room_name + ']: Starting Lab reaction');
            if (Memory.rooms.global_vars.minerals.is_lab_active) room_helpers.run_lab_reactions(current_room_name);
        }

        // console.log('[DEBUG] (main)[' + current_room_name + '] DEFINE ROOM')
        let current_mod = 0;
        if (Game.time % 8 === current_mod) {
            // console.log('[INFO] (main): RUN 8 tickets functions + ' + current_mod + '. Time: ' + Game.time);
            //        room_helpers.get_transfer_target(current_room_name);
            room_helpers.define_room_status(current_room_name);

            // dropped_resources = Memory.rooms[current_room_name].find(FIND_DROPPED_RESOURCES)
            // if (dropped_resources.length > 0) Game.notify('We Have Dropped Resources in our area: ' + dropped_resources.length);
        }

        current_mod = current_mod + tick_between_hard_actions;
        // console.log('[DEBUG] (main)[' + current_room_name + '] current mod: ' + current_mod + '; run: ' + (Game.time % 20) )
        if (Game.time % 20 === current_mod) {
            room_helpers.verify_all_full(current_room_name);
            room_helpers.get_build_targets(current_room_name);
            if (my_room.controller.level < 9) room_helpers.get_repair_civilianl_target(current_room_name); // TODO:change 9 to 7
        }

        if (Game.time % 30 === 0 ) {//&& (Memory.rooms[current_room_name].global_vars.status === 'war' ||
                                     //Memory.rooms.global_vars.disable_repearing_by_towers === false)) {
                                     // !(Memory.rooms.global_vars.disable_repearing_by_towers === true && my_room.controller.level === 8))) {
            room_helpers.get_repair_defence_target(current_room_name);
        }


        current_mod = current_mod + tick_between_hard_actions;
        // console.log('[DEBUG] (main)[' + current_room_name + '] mode:' + current_mod + '; Time%10: ' + (Game.time % 10 === current_mod))
        if (Game.time % 10 === current_mod) {
            // if (current_room_name === 'E36N49') {
            //     room_helpers.empty_terminal(current_room_name, 'E36N48', false, false);
            // }
            room_helpers.verify_energy_miner_is_needed(current_room_name);
            room_helpers.transfer_energy(current_room_name);
        }

        if (Game.time % 30 === 0 && Game.cpu.bucket > 6000) {
            // console.log('[INFO] (main) [' + current_room_name + '] ================= MOD 30 ==================')
            room_helpers.transfer_energy(current_room_name);
            // room_helpers.transfer_mineral(current_room_name);
            // Count storage capacity of terminal and storage
            if (my_room.storage &&
                Memory.rooms[current_room_name].energy_flow.store_used)
                    Memory.rooms[current_room_name].energy_flow.store_used.storage = _.sum(my_room.storage.store)
            if (my_room.terminal) Memory.rooms[current_room_name].energy_flow.store_used.terminal = _.sum(my_room.terminal.store)
            room_helpers.define_extension_first(current_room_name);

            if (Game.cpu.bucket === 10000) Memory.rooms.global_vars.disable_repearing_by_towers = false // 40554000
            else if (Game.cpu.bucket < 8000) {
                my_room.memory.targets.repair_defence = false
                Memory.rooms.global_vars.disable_repearing_by_towers = true
            }
            room_helpers.get_creep_repair_defence(current_room_name);
        }

        if (Game.time % 30 === 0) {
            room_helpers.get_tombstone(current_room_name)
        }

        let t_range = 59
        // if (current_room_name === 'E39N49') console.log('[INFO] (main) [' + current_room_name + '] mod ' + t_range + ': ' + (Game.time % t_range))
        if (Game.time % t_range === 0) {
            room_helpers.update_room_min_ticksToLive(current_room_name)
            // room_helpers.verify_lab_assistent_is_needed(current_room_name)
            if (Game.cpu.bucket < 5000) Game.notify('LOW Bucket level: ' + Game.cpu.bucket);

        }

        if (Game.time % rare_time_range === 0 && Game.cpu.bucket > 9000) {
            // room_helpers.verify_gn_age_difference_and_kill(current_room_name)
            room_helpers.get_minerals_status()
            // If you coment update_labs_info you must comment next Memory.rooms.global_vars.room_by_mineral = room_by_mineral;
            room_helpers.update_labs_info(current_room_name, room_by_mineral);
            // roleTower.create_towers_list(current_room_name);
        }

        if (Game.time % 1000 === 2 ) {
            room_helpers.check_roads_amount(current_room_name)
            room_helpers.find_nukes(current_room_name)
        }
    }

    // if (Game.time % 7200 === 0) { // Notify every 3 hour (tick is about 3 sec)
    //     for (m in Memory.rooms.global_vars.storage_status_by_mineral) {
    //         string_of_mineral = m + ' (bucket: ' + Game.cpu.bucket + '):\n'
    //         for (cur_storage in Memory.rooms.global_vars.storage_status_by_mineral[m]) {
    //             if (cur_storage === 'total') {
    //                 cur_diff = (Memory.rooms.global_vars.storage_status_by_mineral[m][cur_storage] - Memory.rooms.global_vars.prev_storage_status_by_mineral[m][cur_storage])
    //                 string_of_mineral += 'total: ' + Memory.rooms.global_vars.storage_status_by_mineral[m][cur_storage].toLocaleString() + ' (+' + cur_diff.toLocaleString() + ')\n'
    //                 continue
    //             }
    //             string_of_mineral += cur_storage + '\n'
    //             for (cur_room in Memory.rooms.global_vars.storage_status_by_mineral[m][cur_storage]) {
    //                 cur_diff = (Memory.rooms.global_vars.storage_status_by_mineral[m][cur_storage][cur_room] - Memory.rooms.global_vars.prev_storage_status_by_mineral[m][cur_storage][cur_room])
    //                 string_of_mineral += '\t' + cur_room + ': ' + Memory.rooms.global_vars.storage_status_by_mineral[m][cur_storage][cur_room].toLocaleString() +
    //                                      ' (+' + cur_diff.toLocaleString() + ')\n'
    //             }
    //         }
    //         // Game.notify(string_of_mineral)
    //         // Game.notify('Mineral status of ' + m + '(' + Game.cpu.bucket + '): ' +
    //         //     JSON.stringify(Memory.rooms.global_vars.storage_status_by_mineral[m], null, 2))
    //     }
    //     Memory.rooms.global_vars.prev_storage_status_by_mineral = Memory.rooms.global_vars.storage_status_by_mineral
    // }

    // // Before uncomment check uncomment room_helpers.update_labs_info above
    if (Game.time % rare_time_range === 0 && Game.cpu.bucket > 9000) {
        room_by_mineral['reagent']['G'] = ['E27N48', 'E28N48', 'E29N47', 'E33N47', 'E34N47', 'E36N48', 'E37N48', 'E38N48', 'E38N47', 'E39N49']
        Memory.rooms.global_vars.room_by_mineral = room_by_mineral;
    }

    if (Game.time % 1000 === 1) {
        room_helpers.clean_memory();
    }

    console.log('[INFO] (main)[End of Cycle ---] CPU Used: ' + Game.cpu.getUsed().toFixed(2) + '; Ticket Limit: ' + Game.cpu.tickLimit)
    console.log('----------------------------------------------------');

    // Create first roads
    // if (typeof my_room.memory.roads == "undefined") {
    //     my_room.memory.roads = [];
    //     var xy_path = room_helpers.create_road(_.extend(my_spawn.pos, {id: my_spawn.id, structureType: 'spawn'}), _.extend(my_spawn.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'}));  // Spawn-Closest Source
    //     for (i in xy_path) get_struct_obj(xy_path[i][0], xy_path[i][1]);
    //     room_helpers.create_road(_.extend(global_vars.my_room.controller.pos, {id: my_room.controller.id, structureType: 'controller'}), _.extend(my_room.controller.pos.findClosestByPath(FIND_SOURCES_ACTIVE), {structureType: 'source'})); // Controller-Closest Source
    //     // Save in memory important path to build first
    //     //global_vars.my_room.memory.important_structures = xy_path;
    // }

    // if (Game.time % 5 === 0) screepsplus.collect_stats();

//    console.log('[INFO] (main): FINISH UNITS (nominal: ' + Memory.rooms[global_vars.room_name].global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount] + '): ' + JSON.stringify(units));

}
