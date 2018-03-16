var spawn_name = 'max';
var room_name = Object.keys(Game.rooms)[0];

console.log('loaded and run at '+ Game.time)

// function refresh_vars() {
//     return {
//         age_to_drop_and_die: 20,
//         spawn_name: spawn_name,
//         spawn: Game.spawns[spawn_name],
//         my_room: Game.rooms[room_name],
//         game: Game,
//         screeps_general_nominal: 10,
//         screeps_general_war: 30,
//         screeps_general_repair_defance: 20,
//         screeps_general_build: 15,
//         moveTo_ops: {
//             reusePath: 10,           // default: 5
//             //serializeMemory: false, // default: true
//             //noPathFinding: true, // default: false
//             visualizePathStyle: {
//                 fill: 'transparent',
//                 stroke: '#fff',
//                 lineStyle: 'dashed',
//                 strokeWidth: .15,
//                 opacity: .1
//             }
//         },
//         creep_types: {
//             war: {
//                 transfer: [0,0.30,0.30,0.4,0.4,0.5,0.5,0.5,0.5],     // max percentage of transfer from total creeps. indwx is romm's level
//                 build: 0.60,        // max percentage of builders from total creeps
//                 repair_defence: 0.4,          // max percentage of repair units from total creeps
//                 repair_civilian: 0.2,          // max percentage of repair units from total creeps
//                 special_carry: 0.3
//             },
//             peace: {
//                 transfer: 0.2,      // max percentage of transfer from total creeps
//                 build: 0.30,        // max percentage of builders from total creeps
//                 repair_defence: 0.1,          // max percentage of repair units from total creeps
//                 repair_civilian: 0.1,          // max percentage of repair units from total creeps
//                 special_carry: 0.3
//             }
//         }
//     };
// }
//
