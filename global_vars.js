var spawn_name = 'max';
var room_name = Object.keys(Game.rooms)[0];

module.exports = {
    spawn_name: spawn_name,
    spawn: Game.spawns[spawn_name],
    my_room: Game.rooms[room_name],
    creeps_nominal: 10,
    screeps_war: 30,
    screeps_repair_defance: 20,
    screeps_build: 15,
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
    }
};