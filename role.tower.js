var RoleTower;
RoleTower = {
    run: function (current_tower) {
        /*
         current_tower    -   Object of current tower
         Return:    amount of missing energy
         */

        let road2repair = (Game.rooms[global_vars.room_name].memory.towers.road2repair_id) ? Game.getObjectById(Game.rooms[global_vars.room_name].memory.towers.road2repair_id) :
                                        Game.rooms[global_vars.room_name].find(FIND_STRUCTURES,
                                            {filter: object => (object.structureType === STRUCTURE_ROAD && (object.hits < object.hitsMax))})
        current_tower.repair(road2repair);
        if (road2repair.hits === road2repair.hitsMax) Game.rooms[global_vars.room_name].memory.towers.road2repair_id = false;
        return (current_tower.energyCapacity - current_tower.energy);
    }
};

module.exports = RoleTower;