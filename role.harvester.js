var spawn_name = 'max';
var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Game.rooms[room_name].memory.global_vars;

var RoleHarvester = {
    run: function (creep, iam_general) {
        let target;
        let action_out;
        let harvester_type = false;     // needed to use saved id
        let creep_name4log ='max_new';


        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester) [' + creep_name4log +']: ' + ' Carry: ' + creep.carry[RESOURCE_ENERGY] + '; Capacity: ' + creep.carryCapacity);
        if (creep.carry[RESOURCE_ENERGY] === creep.carryCapacity) {
            creep.memory.role = 'undefined';
            creep.memory.harvester_type = false;
            creep.memory.target_id = false;
            return;
        }

        // if ((creep.name === 'max_new1' || creep.name === 'max_new2' || creep.name === 'max_new3' || creep.name === 'max_new4') && (creep.room.name === 'E39N49')){
        //     creep.memory.role = 'upgrade';
        //     creep.memory.harvester_type = false;
        //     creep.memory.target_id = '59f1a59182100e1594f3eb85';
        //     return;
        // }
        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester) [' + creep_name4log +']: ' + JSON.stringify(creep.memory));

        // Here with zero energy. If no enough time to work then die
        if (creep.ticksToLive < global_vars.age_to_drop_and_die) {
            creep.say('Going2die');
            creep.suicide();     // Go to die to Cemetery (a far place)
        }

        if (creep.memory.role !== 'harvest') creep.say('harvesting');
        if (creep.memory.target_id) {
            target = Game.getObjectById(creep.memory.target_id);
            harvester_type = creep.memory.harvester_type;
        } else {
            // target = Game.getObjectById('5a4a2fa40dadc7549dc8d475');
            // if (creep.pos.inRangeTo(target, 5) && target.energy > 0) harvester_type = 'link';
            // else {
            //           target = creep.pos.findClosestByRange(FIND_TOMBSTONES);
            target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);

            if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: DROPPED TARGET: ' + JSON.stringify(target));
            if (target && creep.pos.getRangeTo(target) < 10) harvester_type = 'dropped';

            else {
                // target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_CONTAINER && object.store[RESOURCE_ENERGY] > 0)});
                // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester): GET CONTAINER: ' + JSON.stringify(target));
                // if (target) harvester_type = 'container';
                // else {
                target = Game.getObjectById(Game.rooms[room_name].memory.energy_flow.links.controller);
                if (target && creep.pos.getRangeTo(target) < 3 && target.energy > 0) {
                    harvester_type = 'link';
                    if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: GET LINK: ' + JSON.stringify(target));
                } else {
                    target = creep.pos.findClosestByPath(FIND_TOMBSTONES,{filter: object => (object.store[RESOURCE_ENERGY] > 60) }); //|| creep.pos.getRangeTo(object, 2)});
                    if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: GET TOMBSTONE: ' + JSON.stringify(target));
                    if (target && creep.pos.getRangeTo(target) < 10) harvester_type = 'tombstone';
                    else {
                        target = creep.pos.findClosestByPath(FIND_SOURCES,{filter: object => (object.energy > 60)});
                        if (target) harvester_type = 'source';
                        else if (creep.room.name == 'E39N49') harvester_type = 'go_close';
                    }
                }
            }
            // }

            if (target) {
                creep.memory.target_id = target.id;
                creep.memory.harvester_type = harvester_type;
                if (iam_general) creep.memory.role = 'harvest';   // change role if the creep isn't from special role
            }
        }

        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: HARVESTER Type: ' + harvester_type +' Target: ' + JSON.stringify(target) + '; AFTER TARGET: ' + JSON.stringify(creep.memory));

        // ACTION
        switch(harvester_type) {
            case 'container':
            case 'tombstone':
            case 'link':
                action_out = creep.withdraw(target, RESOURCE_ENERGY);
                break;
            case 'source':
                action_out = creep.harvest(target);
                break;
            case 'dropped':
                action_out = creep.pickup(target);
                break;
            case 'go_close':
                creep.moveTo(Game.getObjectById('5a99c2e49340d4525da5a48f'), global_vars.moveTo_ops);
                break;
            default:
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
        }
        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: HARVESTER Type: ' + harvester_type +' ACTION OUT: ' + action_out);

        if (action_out === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, global_vars.moveTo_ops);
            if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: ERR_NOT_IN_RANGE TARGET: ' + JSON.stringify(creep.memory));
            creep.memory.target_id = target.id;
        } else if (action_out === ERR_INVALID_TARGET) {
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        } else if (action_out === ERR_NOT_ENOUGH_RESOURCES) { // && creep.carry[RESOURCE_ENERGY] > 0) {
            creep.memory.role = 'undefined';
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
            // creep.memory.role = 'transfer';
        } else if (action_out === ERR_FULL) {
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
            creep.memory.role = 'undefined';
        }
        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']:' );


        if (harvester_type !== 'source') {
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        }

        if (creep.carry/creep.carryCapacity > 0.9 && (Game.creeps.length < Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount])) {     // If it's not enought creeps change to transfer
            creep.memory.role = 'transfer';
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        }

        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: LAST TARGET: ' + JSON.stringify(creep.memory));
    }
}

module.exports = RoleHarvester;