const room_helpers = require('room_helpers');

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
        let room_name4log = '';  //E39N49'
        let my_room = Game.rooms[room_name];
        let room_vars = my_room.memory.global_vars;
        let target2repair = false;
        let target2attack = false;
        let long_distance = 15
        let min_capacity_for_long_distance = 0.5
        let free_capacity_percent = (current_tower.store.getFreeCapacity(RESOURCE_ENERGY) / current_tower.store.getCapacity(RESOURCE_ENERGY))

        // TODO: Optimize road target (save it)

        //  console.log('[ERROR] (StructTower.run)[' + room_name +']  Tower?: ' + current_tower.structureType + ' ; ID: ' + current_tower.id);

        if (room_name === room_name4log) console.log('[DEBUG] (StructTower.run)[' + room_name + '][ ' + current_tower.id + '] Creeps: ' + creeps_amount + '; min energy: ' +(tower_energy_proc > Memory.rooms.global_vars.min_tower_enrg2repair));

        let tower_creep  = my_room.memory.towers.current[current_tower_id];
        if(!Game.creeps[tower_creep] || (Game.creeps[tower_creep] && Game.creeps[tower_creep].memory.target_id !== current_tower_id))
            my_room.memory.towers.current[current_tower_id] = false;

        tower_energy_proc = current_tower.store[RESOURCE_ENERGY]/current_tower.store.getCapacity(RESOURCE_ENERGY);
        // console.log('[DEBUG] (StructTower.run) [' + room_name + '] ENERGY PROC: ' + tower_energy_proc)

        if (room_vars.status == 'war') {
            if (room_name === room_name4log) console.log('[INFO] (StructTower.run) [' + room_name + '][ ' + current_tower.id + '] BEFORE get_existing_hostile_id')
            // let hostile2attack = room_helpers.get_existing_hostile_id(room_name);
            let hostiles_2_attack = my_room.memory.hostile_ids_2attack;
            let hostile2attack = (hostiles_2_attack.length > 0) ? Game.getObjectById(hostiles_2_attack[0]) : null;
            if (room_name === room_name4log) console.log('[INFO] (StructTower.run) [' + room_name + '][ ' + current_tower.id + '] hostiles_2_attack: ' + JSON.stringify(hostiles_2_attack));
            while (hostile2attack == null && hostiles_2_attack.length > 0) {
                hostiles_2_attack.shift();
                hostile2attack = Game.getObjectById(hostiles_2_attack[0]);
            }
            if (room_name === room_name4log) console.log('[INFO] (StructTower.run) [' + room_name + '][ ' + current_tower.id + '] hostile2attack: ' + JSON.stringify(hostile2attack));
            // my_room.memory.hostile_ids_2attack = hostiles_2_attack

            if (room_name === room_name4log) console.log('[INFO] (StructTower.run) [' + room_name + '][ ' + current_tower.id + '] IF: ' + (hostile2attack && free_capacity_percent < min_capacity_for_long_distance || current_tower.pos.getRangeTo(hostile2attack) <= long_distance && free_capacity_percent >= min_capacity_for_long_distance));
            target2attack = ((hostile2attack && free_capacity_percent < min_capacity_for_long_distance) || (current_tower.pos.getRangeTo(hostile2attack) <= long_distance && free_capacity_percent >= min_capacity_for_long_distance)) ? hostile2attack : false;
            // target2attack = (hostile2attack) ? hostile2attack : false;
            if (room_name === room_name4log) console.log('[INFO] (StructTower.run) [' + room_name + '][ ' + current_tower.id + '] free_capacity_percent: ' + free_capacity_percent +'; min_capacity_for_long_distance: '+ min_capacity_for_long_distance+'; current_tower.pos.getRangeTo(hostile2attack): '+ current_tower.pos.getRangeTo(hostile2attack)+'; long_distance: '+ long_distance);
            if (room_name === room_name4log) console.log('[INFO] (StructTower.run) [' + room_name + '][ ' + current_tower.id + '] target2attack - 1: ' + JSON.stringify(target2attack.id));

            // if (tower_energy_proc > 0.7) {
            //     target2repair = Game.getObjectById(my_room.memory.targets.repair_defence);
            //     console.log('[INFO] (StructTower.run) [' + room_name + '] it"s WAR: Repair DEFENCE: (' + (target2repair?target2repair.pos.x:'na') + ',' + (target2repair?target2repair.pos.y:'na') +')');
            // }
        } else if (tower_energy_proc > Memory.rooms.global_vars.min_tower_enrg2repair && !(Game.time % 3) && creeps_amount >= 1) {
            // let targets2repair = my_room.find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_ROAD && (object.hits/object.hitsMax < 0.7))});
            let repair_civilian = (my_room.memory.targets.repair_civilian) ? Game.getObjectById(my_room.memory.targets.repair_civilian) : false
            target2repair = (repair_civilian.hits < repair_civilian.hitsMax) ? Game.getObjectById(my_room.memory.targets.repair_civilian) : Game.getObjectById(my_room.memory.targets.repair_defence);
            // target2repair = (my_room.memory.targets.repair_defence) ? Game.getObjectById(my_room.memory.targets.repair_defence) : Game.getObjectById(my_room.memory.targets.repair_civilian);

            if (room_name === room_name4log) console.log('[DEBUG] (StructTower.run)[' + room_name +'][' + current_tower_id + '] Setting Target to Repair: ' + target2repair + '; Defence: ' + my_room.memory.targets.repair_defence + '; Civil: ' + my_room.memory.targets.repair_civilian)
            // target2repair = false;   // Uncomment to disable reparing

            // let targets2heal = Game.rooms[room_name].find(FIND_MY_CREEPS, {filter: object => ()});

        }
        // console.log('[DEBUG] (StructTower.run)[ ' + current_tower.id + ']: To Attack: ' + (target2attack?target2attack.length:0) + '; To repair: ' + (target2repair?target2repair.length:0));
        // if (room_name === 'E28N48') console.log('[DEBUG] (StructTower.run)[' + room_name + '][ ' + current_tower.id + '] Repair: ' + target2repair.id);
        if (room_name === room_name4log) console.log('[INFO] (StructTower.run) [' + room_name + '][ ' + current_tower.id + '] target2attack: ' + JSON.stringify(target2attack.id));
        if (target2attack) {
            console.log('[DEBUG] (StructTower.run)[' + room_name +'][' + current_tower_id + '] Target to Attack: ' + target2attack.id)
            current_tower.attack(target2attack);
        } else if (target2repair) {
            // console.log('[DEBUG] (StructTower.run)[' + room_name +'][' + current_tower_id + '] Target to Repair: ' + target2repair)
            current_tower.repair(target2repair);
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
