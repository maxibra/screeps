var spawn_name = 'max';

module.exports = {
    spawn_name: spawn_name,
    spawn: Game.spawns[spawn_name],
    my_room: Game.rooms.sim,
    moveTo_ops: {
        reusePath: 50,           // default: 5
        serializeMemory: false, // default: true
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