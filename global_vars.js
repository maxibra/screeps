var spawn_name = 'max';
var room_name = Object.keys(Game.rooms)[0];

module.exports = {
    spawn_name: spawn_name,
    spawn: Game.spawns[spawn_name],
    my_room: Game.rooms[room_name],
    screeps_general_nominal: 10,
    screeps_general_war: 30,
    screeps_general_repair_defance: 20,
    screeps_general_build: 15,
    moveTo_ops: {
        reusePath: 10,           // default: 5
        //serializeMemory: false, // default: true
        //noPathFinding: true, // default: false
        visualizePathStyle: {
            fill: 'transparent',
            stroke: '#fff',
            lineStyle: 'dashed',
            strokeWidth: .15,
            opacity: .1
        }
    },
    creep_types: {
        war: {
            transfer: 0.30,      // max percentage of transfer from total creeps
            build: 0.60,        // max percentage of builders from total creeps
            repair_defence: 0.4,          // max percentage of repair units from total creeps
            repair_civilian: 0.2,          // max percentage of repair units from total creeps
            special_carry: 0.3
        },
        peace: {
            transfer: 0.2,      // max percentage of transfer from total creeps
            build: 0.30,        // max percentage of builders from total creeps
            repair_defence: 0.1,          // max percentage of repair units from total creeps
            repair_civilian: 0.1,          // max percentage of repair units from total creeps
            special_carry: 0.3
        }
    }
};