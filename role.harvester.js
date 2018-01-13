var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Game.rooms[room_name].memory.global_vars;

var RoleHarvester = {
    run: function (creep, iam_general) {
        let target;
        let action_out;
        let harvester_type = false;     // needed to use saved id

        // Here with zero energy. If no enough time to work then die
        if (creep.ticksToLive < global_vars.age_to_drop_and_die) {
            creep.say('Going2die');
            creep.suicide();     // Go to die to Cemetery (a far place)
        }

        if (creep.memory.role !== 'harvest') creep.say('harvesting');
        if (creep.memory.target_id) target = creep.memory.target_id;
        else {
            // Containers
            target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if (target && creep.pos.getRangeTo(target) < 6) harvester_type = 'dropped';
            else {
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_CONTAINER && object.store[RESOURCE_ENERGY] > 0)});
                if (target) harvester_type = 'container';
                else {
                    target = creep.pos.findClosestByPath(FIND_SOURCES,{filter: object => (object.energy > 0)});
                    if (target) harvester_type = 'source';
                }
            }

            if (target) {
                creep.memory.target_id = target.id;
                creep.memory.harvester_type = harvester_type;
                if (iam_general) creep.memory.role = 'harvest';   // change role if the creep isn't from special role
            }
        }

        // ACTION
        switch(harvester_type) {
            case 'container':
                action_out = creep.withdraw(target, RESOURCE_ENERGY);
                break;
            case 'source':
                action_out = creep.harvest(target);
                break;
            case 'dropped':
                action_out = creep.pickup(target);
                break;
            default:
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
        }

        if (action_out === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, global_vars.moveTo_ops);
            creep.memory.target_id = target;
        } else if (action_out === ERR_NOT_ENOUGH_RESOURCES && creep.carry > 0) {
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
            creep.memory.role = 'transfer';
        }


        if (harvester_type !== 'source') {
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        }

        if (creep.carry/creep.carryCapacity > 0.9 && (Game.creeps.length < Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount])) {     // If it's not enought creeps change to transfer
            creep.memory.role = 'transfer';
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        }
    }
}

module.exports = RoleHarvester;