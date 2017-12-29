var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Game.rooms[room_name].memory.global_vars;
var my_spawn = Game.spawns[global_vars.spawn_name];
var my_room = Game.rooms[global_vars.room_name];

var RoleTower;
RoleTower = {
    run: function (current_tower_id, creeps_amount) {
        /*
         current_tower    -   Object of current tower
         Return:    amount of missing energy
         */
        let target2repair;
        let current_tower = Game.getObjectById(current_tower_id);
        if (Game.spawns[spawn_name].memory.general.status == 'war' || creeps_amount >= 14 ) {
            target2repair = Game.getObjectById(Game.rooms[global_vars.room_name].memory.target_repair_defence);
            console.log('[INFO] (RoleTower.run) it"s WAR: Repair DEFENCE');
        } else {
            let targets2repair = (Game.rooms[global_vars.room_name].memory.towers.road2repair_id) ? Game.getObjectById(Game.rooms[global_vars.room_name].memory.towers.road2repair_id) :
                Game.rooms[global_vars.room_name].find(FIND_STRUCTURES,
                    {filter: object => (object.structureType === STRUCTURE_ROAD && (object.hits/object.hitsMax < 0.85))});
            //console.log('[DEBUG] (RoleTower.run): Road X: ' + road2repair.pos.x + '; Road y: ' + road2repair.pos.y);
            target2repair = (targets2repair) ? targets2repair[0] : Game.rooms[global_vars.room_name].memory.target_repair_defence;
            console.log('[DEBUG] (RoleTower.run) Roads to repear: ' + targets2repair.length);
        }
        let exit_code = current_tower.repair(target2repair);
        //console.log('[DEBUG] (RoleTower.run): Tower ID: ' + current_tower.id + '; EXIT code: ' + exit_code);

        if (!target2repair || target2repair.hits === target2repair.hitsMax) Game.rooms[global_vars.room_name].memory.towers.target2repair = false;
        return (current_tower.energyCapacity - current_tower.energy);
    }
};

module.exports = RoleTower;