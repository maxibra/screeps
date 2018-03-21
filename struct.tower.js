var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Game.rooms[room_name].memory.global_vars;
var my_spawn = Game.spawns[global_vars.spawn_name];
var my_room = Game.rooms[global_vars.room_name];

var StructTower;
StructTower = {
    run: function (current_tower_id, creeps_amount) {
        /*
         current_tower    -   Object of current tower
         Return:    amount of missing energy
         */
        let target2repair;
        let target2attack;
        let current_tower = Game.getObjectById(current_tower_id);

        // TODO: Optimize road target (save it)

        console.log('[INFO] (StructTower.run) Room status: ' + Game.spawns[spawn_name].memory.general.status);
        if (Game.spawns[spawn_name].memory.general.status == 'war') {
            target2attack = Game.rooms[global_vars.room_name].find(FIND_HOSTILE_CREEPS);
            target2repair = Game.getObjectById(Game.rooms[room_name].memory.targets.repair_defence);
            console.log('[INFO] (StructTower.run) it"s WAR: Repair DEFENCE: (' + (target2repair?target2repair.pos.x:'na') + ',' + (target2repair?target2repair.pos.y:'na') +')');
        } else if (current_tower.energy/current_tower.energyCapacity > 0.4) {
            targets2repair = (Game.rooms[room_name].memory.towers.road2repair_id) ? Game.getObjectById(Game.rooms[global_vars.room_name].memory.towers.road2repair_id) :
                Game.rooms[room_name].find(FIND_STRUCTURES,
                    {filter: object => (object.structureType === STRUCTURE_ROAD && (object.hits/object.hitsMax < 0.8))});
            //console.log('[DEBUG] (StructTower.run): Road X: ' + road2repair.pos.x + '; Road y: ' + road2repair.pos.y);
            target2repair = targets2repair.length > 0 ? targets2repair[0] : []; //Game.getObjectById(Game.rooms[room_name].memory.targets.repair_defence);
            console.log('[DEBUG] (StructTower.run)[' + current_tower_id + ']: Roads to repear: ' + targets2repair.length); // + '; Defence: (' + (target2repair?target2repair.pos.x:'na') + ',' + (target2repair?target2repair.pos.y:'na') +')');
        }
//        console.log('[DEBUG] (StructTower.run)[ ' + current_tower.id + ']: To Attack: ' + (target2attack?target2attack.length:0) + '; To repair: ' + (target2repair?target2repair.length:0));
        let current_life_status = Game.spawns[spawn_name].memory.general.status;
        let current_creep_types = Game.rooms[room_name].memory.global_vars.creep_types[current_life_status];
//        console.log('[DEBUG] (StructTower.run)[' + current_tower_id + ']: Targets to attack: ' + target2attack.length);
        if (target2attack && target2attack.length > 0) {
            console.log('[DEBUG] (StructTower.run)[' + current_tower_id + ']: Attack (' + target2attack.id)
            current_tower.attack(target2attack[0]);
            current_creep_types.repair_civilian = 0.4;
            current_creep_types.repair_defence = 0.1;
        } else if (target2repair ) {
            current_tower.repair(target2repair);
            current_creep_types.repair_civilian = 0;
            current_creep_types.repair_defence = 0;
            current_creep_types.transfer[current_life_status] = 0.5;
        }

        if (!target2repair || target2repair.hits === target2repair.hitsMax) Game.rooms[global_vars.room_name].memory.towers.target2repair = false;
        return (current_tower.energyCapacity - current_tower.energy);
    }
};

module.exports = StructTower;