/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('global_vars');
 * mod.thing == 'a thing'; // true
 */
var spawn_name = 'max';

module.exports = {
    spawn_name: spawn_name,
    spawn: Game.spawns[spawn_name],
    my_room: Game.rooms.sim
};