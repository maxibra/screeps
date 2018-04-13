// var spawn_name = 'max';
// var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
var global_vars = Memory.rooms.global_vars;

var RoleHarvester = {
    run: function (creep, iam_general) {
        let target;
        let room_name = creep.room.name;
        let my_room = Game.rooms[room_name];
        let action_out;
        let harvester_type = false;     // needed to use saved id
        let creep_name4log ='stam';

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
        // if (creep.ticksToLive < global_vars.age_to_drop_and_die) {
        //     creep.say('Going2die');
        //     creep.suicide();     // Go to die to Cemetery (a far place)
        // }

        if (creep.memory.role !== 'harvest') creep.say('harvesting');
        if (creep.memory.target_id) {
            target = Game.getObjectById(creep.memory.target_id);
            harvester_type = creep.memory.harvester_type;
        } else {
            target = false;
            for (let l in my_room.memory.energy_flow.links.destinations) {
                cur_target = Game.getObjectById(my_room.memory.energy_flow.links.destinations[l]);
                if (cur_target && creep.pos.getRangeTo(cur_target) < 3 && cur_target.energy > 0) {
                    target =  cur_target;
                    break;
                }
            }               
            if (target) {   // LINK
                harvester_type = 'link';
                if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: GET LINK: ' + JSON.stringify(target));
            } else {
                target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: object => (creep.pos.getRangeTo(object) < 5 || object.energy > 200)});
                if (target && !(room_name === 'E39N49' && target.pos.x > 35) && !(room_name === 'E37N48' && target.pos.x <10)) {
                    harvester_type = 'dropped';
                } else {
                    target = creep.pos.findClosestByRange(FIND_TOMBSTONES,{filter: object => ((object.store[RESOURCE_ENERGY] > 0 && creep.pos.getRangeTo(object) < 7) || 
                                                                                               object.store[RESOURCE_ENERGY] > 200)}); //|| creep.pos.getRangeTo(object, 2)});
                    if (target && !(room_name === 'E39N49' && target.pos.x > 35) && !(room_name === 'E37N48' && target.pos.x < 10)) {
                        harvester_type = 'tombstone';
                    } else 
                    if (my_room.memory.energy_flow.storage && Game.getObjectById(my_room.memory.energy_flow.storage).eneregy > 0 && !my_room.memory.global_vars.all_full) {
                    //     harvester_type = 'storage';
                    //     target = Game.getObjectById(my_room.memory.energy_flow.storage);
                    } else {
                        target = (creep.memory.target_id) ? creep.memory.target_id : creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE,{filter: object => (object.energy > 60)});
                        far_source = Game.getObjectById('59f1a54882100e1594f3e357');
                        close_source = Game.getObjectById('59f1a54882100e1594f3e356')
                        if (room_name === 'E34N47' && target && target.id === far_source.id &&
                            close_source.ticksToRegeneration < 150) {
                                harvester_type = 'go_close';
                            }
                        else if (target) harvester_type = 'source';
                        else if (creep.room.name == 'E39N49' || creep.room.name == 'E38N48') harvester_type = 'go_close';
                    }
                }
            }

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
            case 'storage':
                action_out = creep.withdraw(target, RESOURCE_ENERGY);
                creep.memory.role = 'undefined';
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
                break;
            case 'source':
                action_out = creep.harvest(target);
                break;
            case 'dropped':
                action_out = creep.pickup(target);
                break;
            case 'go_close':
                let c_id = false;
                switch (creep.room.name) {
                    case 'E39N49': 
                        c_id = '5a99c2e49340d4525da5a48f'
                        break;
                    case 'E38N48':
                        c_id = '5ac622cbbf6cfa17b08c2299';
                        break;
                    case 'E34N47':
                        c_id = '59f1a54882100e1594f3e356';
                        break;
                    default:
                        creep.memory.target_id = false;
                        creep.memory.harvester_type = false;                        
                }
                if (c_id) creep.moveTo(Game.getObjectById(c_id), global_vars.moveTo_ops);
                break;
            default:
                creep.memory.target_id = false;
                creep.memory.harvester_type = false;
        }
        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: HARVESTER Type: ' + harvester_type +' ACTION OUT: ' + action_out);

        if (action_out === OK) creep.memory.stuck = 0;
        else if (action_out === ERR_NOT_IN_RANGE) {
            if (creep.pos.getRangeTo(target) < 4) creep.memory.stuck++;
            creep.moveTo(target, global_vars.moveTo_ops);
            if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: ERR_NOT_IN_RANGE TARGET; STUCk: ' +  creep.memory.stuck + '; Memory: ' + JSON.stringify(creep.memory));
            if (creep.memory.stuck > 5) {
                let room_sources = Game.rooms[room_name].memory.energy_flow.sources;
                let next_source = false;
                for (let i in room_sources) {
                    if (target.id === room_sources[i]) continue;
                    next_source = room_sources[i];
                }
                if (next_source) {
                    creep.memory.target_id = next_source    
                    creep.memory.harvester_type = 'source'
                } else {
                    creep.memory.target_id = false;
                    creep.memory.harvester_type = 'go_close'
                }
                creep.memory.stuck = 0;
            } else creep.memory.target_id = target.id;
        } else if (action_out === ERR_INVALID_TARGET) {
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        } else if (action_out === ERR_NOT_ENOUGH_RESOURCES || action_out === ERR_FULL) { // && creep.carry[RESOURCE_ENERGY] > 0) {
            creep.memory.role = 'undefined';
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
            // creep.memory.role = 'transfer';
        }
        // if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']:' );


        if (harvester_type !== 'source' && harvester_type !== 'mineral') {
            creep.memory.role = 'undefined';
            creep.memory.target_id = false;
            creep.memory.harvester_type = false;
        }

        // if (creep.carry/creep.carryCapacity > 0.9 && (Game.creeps.length < Game.rooms[global_vars.room_name].memory.global_vars.screeps_max_amount[Game.spawns[spawn_name].memory.general.creeps_max_amount])) {     // If it's not enought creeps change to transfer
        //     creep.memory.role = 'transfer';
        //     creep.memory.target_id = false;
        //     creep.memory.harvester_type = false;
        // }

        if (creep.name === creep_name4log) console.log('[DEBUG] (RoleHarvester)[' + creep_name4log +']: LAST TARGET: ' + JSON.stringify(creep.memory));
    }
}

module.exports = RoleHarvester;