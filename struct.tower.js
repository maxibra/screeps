var creep_helpers = require('creep_helpers');

var StructTower = {
    run: function (current_tower_id, creeps_amount) {
        /*
         current_tower    -   Object of current tower
         Return:    amount of missing energy
         */
        let global_vars = Memory.rooms.global_vars;
        let current_tower = Game.getObjectById(current_tower_id);

        if (!current_tower) {
            console.log('[ERROR] (StructTower.run) Tower: ' + current_tower_id + ' doesnt exist');
            return;
        }

        let room_name = current_tower.room.name;
        let my_room = Game.rooms[room_name];
        let room_vars = my_room.memory.global_vars;
        let target2repair = false;
        let target2heal;
        let target2attack;
        let room_log = "" // 'E27N49';
        let long_distance = 15
        let min_capacity_for_long_distance = 0.5
        let free_capacity_percent = (current_tower.store.getFreeCapacity(RESOURCE_ENERGY) / current_tower.store.getCapacity(RESOURCE_ENERGY))

        // TODO: Optimize road target (save it)

        //  console.log('[ERROR] (StructTower.run)[' + room_name +']  Tower?: ' + current_tower.structureType + ' ; ID: ' + current_tower.id);

        if (room_name === room_log) console.log('[DEBUG] (StructTower.run)[' + room_name + '][ ' + current_tower.id + '] Creeps: ' + creeps_amount + '; min energy: ' +(tower_energy_proc > Memory.rooms.global_vars.min_tower_enrg2repair));


        let tower_creep  = my_room.memory.towers.current[current_tower_id];
        if(!Game.creeps[tower_creep] || (Game.creeps[tower_creep] && Game.creeps[tower_creep].memory.target_id !== current_tower_id))
            my_room.memory.towers.current[current_tower_id] = false;

        tower_energy_proc = current_tower.store[RESOURCE_ENERGY]/current_tower.store.getCapacity(RESOURCE_ENERGY);
        // console.log('[DEBUG] (StructTower.run) [' + room_name + '] ENERGY PROC: ' + tower_energy_proc)

        if (room_vars.status == 'war') {
            let hostile2attack;
            if (my_room.memory.hostile2attack) {
                hostile2attack = Game.getObjectById(my_room.memory.hostile2attack);
                if (hostile2attack && hostile2attack.room.name !== room_name) hostile2attack = false;
            }
            // console.log('[DEBUG] [structTower] Hostile2Attack by getObject:' + ((hostile2attack)?hostile2attack.id:'NA'))

            if (!hostile2attack) {
                // console.log('[DEBUG] (structTower)('+ room_name + ') Searching target to ATTACk')
                all_hostile = my_room.find(FIND_HOSTILE_CREEPS);
                    //  , {filter: object => (object.owner.username !== 'Sergeev' || (object.owner.username === 'Sergeev' && creep_helpers.is_millitary(object)))});
                all_hostile.sort((a,b) => current_tower.pos.getRangeTo(a) - current_tower.pos.getRangeTo(b));   // sort from closer to far
                if (all_hostile.length > 0) {
                    target2attack = all_hostile[0];
                }

                // First terminated heal creep
                let heal_is_found = false;
                for (let h in all_hostile) {
                    for(let b in all_hostile[h].body) {
                        // console.log('[INFO] (StructTower.run) [' + room_name + ']Search fr Healer. Type: ' + all_hostile[h].body[b].type);
                        if (all_hostile[h].body[b].type === 'heal' && current_tower.pos.getRangeTo(all_hostile[0]) < 20) {
                            target2attack = all_hostile[h];
                            heal_is_found = true;
                            // console.log('[INFO] (StructTower.run) [' + room_name + '] Enemy healer is found');
                            break;
                        }
                    }
                    if (heal_is_found) break;
                }
                my_room.memory.hostile2attack = (target2attack) ? target2attack.id : false;
                // console.log('[INFO] (StructTower.run) [' + room_name + '] Target to Attack: ' + JSON.stringify(target2attack));
            } else {
                target2attack = (free_capacity_percent < min_capacity_for_long_distance && current_tower.pos.getRangeTo(hostile2attack) > long_distance) ? hostile2attack : false;
            }


            if (tower_energy_proc > 0.7) target2repair = Game.getObjectById(my_room.memory.targets.repair_defence);
            console.log('[INFO] (StructTower.run) [' + room_name + '] it"s WAR: Repair DEFENCE: (' + (target2repair?target2repair.pos.x:'na') + ',' + (target2repair?target2repair.pos.y:'na') +')');
        } else if (tower_energy_proc > Memory.rooms.global_vars.min_tower_enrg2repair && !(Game.time % 3) && creeps_amount >= 1) {
            // let targets2repair = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_ROAD && (object.hits/object.hitsMax < 0.7))});

            target2repair = (my_room.memory.targets.repair_civilian) ? Game.getObjectById(my_room.memory.targets.repair_civilian) : Game.getObjectById(my_room.memory.targets.repair_defence);
            // target2repair = (my_room.memory.targets.repair_defence) ? Game.getObjectById(my_room.memory.targets.repair_defence) : Game.getObjectById(my_room.memory.targets.repair_civilian);

            if (room_name === room_log) console.log('[DEBUG] (StructTower.run)[' + room_name +'][' + current_tower_id + '] Setting Target to Repair: ' + target2repair + '; Defence: ' + my_room.memory.targets.repair_defence + '; Civil: ' + my_room.memory.targets.repair_civilian)
            // target2repair = false;   // Uncomment to disable reparing

            // let targets2heal = Game.rooms[room_name].find(FIND_MY_CREEPS, {filter: object => ()});

        }
        // console.log('[DEBUG] (StructTower.run)[ ' + current_tower.id + ']: To Attack: ' + (target2attack?target2attack.length:0) + '; To repair: ' + (target2repair?target2repair.length:0));
        // if (room_name === 'E28N48') console.log('[DEBUG] (StructTower.run)[' + room_name + '][ ' + current_tower.id + '] Repair: ' + target2repair.id);
        let current_life_status = room_vars.status;
        let current_creep_types = room_vars.creep_types[current_life_status];
//        console.log('[DEBUG] (StructTower.run)[' + current_tower_id + ']: Targets to attack: ' + target2attack.length);
        if (target2attack) {
            console.log('[DEBUG] (StructTower.run)[' + room_name +'][' + current_tower_id + '] Target to Attack: ' + target2attack.id)
            current_tower.attack(target2attack);
            // current_creep_types.repair_civilian = 0.4;
            // current_creep_types.repair_defence = 0.1;
        } else if (target2repair) {
            // console.log('[DEBUG] (StructTower.run)[' + room_name +'][' + current_tower_id + '] Target to Repair: ' + target2repair)
            current_tower.repair(target2repair);
            // current_creep_types.repair_civilian = 0;
            // current_creep_types.repair_defence = 0;
            // current_creep_types.transfer = 0.5;
        } else if (my_room.memory.targets.my2heal.length > 0) {
            current_tower.heal(Game.getObjectById(my_room.memory.targets.my2heal[0]));
        }

        return (current_tower.store.getCapacity(RESOURCE_ENERGY) - current_tower.store[RESOURCE_ENERGY]);
    },
    create_towers_list: function (room_name) {
        let towers_list = [];
        let my_room = Game.rooms[room_name];
        if (!my_room) return;

        let room_vars = my_room.memory.global_vars;
        let all_towers = my_room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        for (let i=0;i<all_towers.length;i++) {
            //            console.log('[DEBUG] (main): TOWER' + JSON.stringify(all_towers[i]));
            if (!my_room.memory.towers.current[all_towers[i].id]) my_room.memory.towers.current[all_towers[i].id] = false;
        }
        // }
        if (towers_list.length > 0) room_vars.creep_types[room_vars.status].repair_civilian = 0;

    }
};

module.exports = StructTower;
