var global_vars = Memory.rooms.global_vars;

// Game.rooms['E37N48'].memory.energy_flow.long_harvest = [{x:21, y: 27, roomName:'E37N49'}]
// Game.rooms['E37N48'].memory.energy_flow.long_harvest = [{x:21, y: 27, roomName:'E37N49'}]
var RoleLongHarvester = {
    run: function (creep) {
        let room_name = creep.room.name;
        let my_room = Game.rooms[room_name];
        let long_harvester_mem = creep.memory;
        let action_out;
        let target_pos = creep.memory.target_id;
        // let source_away = creep.memory.target_id;
        console.log('[DEBUG] (RoleLongHarvester) [' + creep.name +']: ' + 'MEM: ' + JSON.stringify(long_harvester_mem));

        // target = new RoomPosition(long_harvester_mem[0].x, long_harvester_mem[0].y, long_harvester_mem[0].roomName);

        if (creep.memory.role !== 'long_harvest') creep.say('long_harvesting');
        let cur_source_away = new RoomPosition(target_pos.x, target_pos.y, target_pos.roomName);
        creep.memory.target_id = cur_source_away;
        
        switch (creep.memory.harvester_type) {
            case 'move_away':
                action_out = creep.moveTo(cur_source_away, global_vars.moveTo_op);
                break;
            case 'source':
                action_out = creep.harvest(cur_source_away);
                break;
            case 'move_back':
                action_out = creep.moveTo(creep.memory.homeland_target, global_vars.moveTo_op);
                break;                
        }

        if (creep.energy === 0 && creep.pos.isNearTo(target)) creep.memory.harvester_type = 'source';
        if (creep.energy === creep.energyCapacity) {
            creep.memory.harvester_type = 'move_back';
            if (room_name === creep.memory.homeland) {
                creep.memory.role = 'undefined';
                creep.memory.homeland = false;
            }
        }
        console.log('[DEBUG] (RoleLongHarvester) [' + creep.name +']: ' + 'Out Act: ' + action_out + '; Target: ' + JSON.stringify(cur_source_away));

        // switch(action_out) {
        //     case 'OK':
        //     case ERR_NOT_IN_RANGE:
        //         creep.moveTo(target, global_vars.moveTo_ops);
        //         break;
        // }
    }
}

module.exports = RoleLongHarvester;