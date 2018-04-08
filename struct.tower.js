var StructTower;

StructTower = {
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
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let target2repair = false;
        let target2attack;
        // TODO: Optimize road target (save it)

        let tower_creep  = Game.rooms[room_name].memory.towers.current[current_tower_id];
        if(!Game.creeps[tower_creep] || (Game.creeps[tower_creep] && Game.creeps[tower_creep].memory.target_id !== current_tower_id))
            Game.rooms[room_name].memory.towers.current[current_tower_id] = false;
        
        tower_energy_proc = current_tower.energy/current_tower.energyCapacity;
        if (room_vars.status == 'war') {
            all_hostile = Game.rooms[room_name].find(FIND_HOSTILE_CREEPS);
            target2attack = all_hostile[0];

            let heal_is_found = false;
            for (let h in all_hostile) {
                for(let b in all_hostile[h].body) {
                    if (all_hostile[h].body[b].type === 'heal') {
                        target2attack = all_hostile[h];
                        break;
                    }
                }
                if (heal_is_found) break;
            }

            if (tower_energy_proc > 0.7) target2repair = Game.getObjectById(Game.rooms[room_name].memory.targets.repair_defence);
            console.log('[INFO] (StructTower.run) [' + room_name + '] it"s WAR: Repair DEFENCE: (' + (target2repair?target2repair.pos.x:'na') + ',' + (target2repair?target2repair.pos.y:'na') +')');
        } else if (tower_energy_proc > 0.7 && !(Game.time % 10)) {
            targets2repair = Game.rooms[room_name].find(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_ROAD && (object.hits/object.hitsMax < 0.7))});
            // console.log('[DEBUG] (StructTower.run): Road X: ' + road2repair.pos.x + '; Road y: ' + road2repair.pos.y);
            target2repair = targets2repair.length > 0 ? targets2repair[0] : []; //Game.getObjectById(Game.rooms[room_name].memory.targets.repair_defence);

            // ***** LOG
            // console.log('[DEBUG] (StructTower.run){' + Game.time + '} [' + current_tower.room.name + ' : ' + current_tower_id + ']: Roads to repear: ' + targets2repair.length); // + '; Defence: (' + (target2repair?target2repair.pos.x:'na') + ',' + (target2repair?target2repair.pos.y:'na') +')');
            // *********
            // target2repair = false;
        }
//        console.log('[DEBUG] (StructTower.run)[ ' + current_tower.id + ']: To Attack: ' + (target2attack?target2attack.length:0) + '; To repair: ' + (target2repair?target2repair.length:0));
        let current_life_status = room_vars.status;
        let current_creep_types = room_vars.creep_types[current_life_status];
//        console.log('[DEBUG] (StructTower.run)[' + current_tower_id + ']: Targets to attack: ' + target2attack.length);
        if (target2attack) {
            console.log('[DEBUG] (StructTower.run)[' + current_tower_id + ']: Attack (' + target2attack.id)
            current_tower.attack(target2attack);
            // current_creep_types.repair_civilian = 0.4;
            // current_creep_types.repair_defence = 0.1;
        } else if (target2repair ) {
            current_tower.repair(target2repair);
            // current_creep_types.repair_civilian = 0;
            // current_creep_types.repair_defence = 0;
            // current_creep_types.transfer = 0.5;
        }

        return (current_tower.energyCapacity - current_tower.energy);
    },
    create_towers_list: function (room_name) {
        let towers_list = [];
        let room_vars = Game.rooms[room_name].memory.global_vars;
        let all_towers = Game.rooms[room_name].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        for (let i=0;i<all_towers.length;i++) {
            //            console.log('[DEBUG] (main): TOWER' + JSON.stringify(all_towers[i]));
            if (!Game.rooms[room_name].memory.towers.current[all_towers[i].id]) Game.rooms[room_name].memory.towers.current[all_towers[i].id] = false;
        }
        // }
        if (towers_list.length > 0) room_vars.creep_types[room_vars.status].repair_civilian = 0;

    }
};

module.exports = StructTower;