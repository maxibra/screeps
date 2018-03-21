var creep_helpers = require('creep_helpers');
var role_harvester = require('role.harvester');
var role_miner = require('role.miner');
//var global_vars = require('global_vars')();

// var spawn_name = 'max';
// var room_name = 'E39N49';   // Object.keys(Game.rooms)[0];
// var global_vars = Game.rooms[room_name].memory.global_vars;
// var my_room = Game.rooms[global_vars.room_name];

var structCreep = {
    run: function(creep, units) {
        // role's definition
        let room_name = creep.room.name;
        let my_room = Game.rooms[room_name];
        let global_vars = Game.rooms[room_name].memory.global_vars;
        let iam_general = (typeof creep.memory.special === "undefined");
        var condition2change_role = (iam_general && ((creep.memory.role === 'harvest' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) ||
            creep.memory.role === 'undefined'));
        // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Condition to change role: ' + condition2change_role + '; General: ' + iam_general +'; Role: ' + creep.memory.role);
        var transfer_target;
        // Game.spawns['max'].spawnCreep([MOVE,MOVE,MOVE,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH], 'claimer1', {'role': 'claimer'})
        // if (creep.id === '5ab2077e96dbc27d8bfadc5e') creep.memory.role = 'repair_defence';
        if (creep.name === 'claimer' || creep.name === 'claimer1' || creep.name === 'claimer2' || creep.name === 'claimer3') creep.memory.role = 'claimer';
        else if(creep.carry.energy === 0 || creep.memory.role === 'harvest') {
            if (creep.memory.role !== 'harvest') creep.say('harvesting');
            creep.memory.role = 'harvest';
            creep.memory.target_id == false;
            // } else if (creep.room.name === 'E38N49' && (creep.name === 'max_new1' || creep.name === 'max_new2' )) { //|| creep.name === 'max_new3' || creep.name === 'max_new4' || creep.name === 'max_new5')) { // || creep.name === 'max_new6')) {
            // creep.memory.role = 'transfer';
            // if ( creep.memory.target_id === false || creep.memory.target_id === '59f1a59182100e1594f3eb85') {
            //     let target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {filter: object => (object.structureType == STRUCTURE_ROAD || object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_EXTENSION || object.structureType == STRUCTURE_SPAWN || object.structureType == STRUCTURE_TOWER)});
            //     if (target) {
            //         creep.memory.target_id = target.id;
            //         creep.memory.role = 'build';
            //         // console.log('[DEBUG] (build new): Name: ' + creep.name + '; target: ' + creep.memory.target_id)
            //     } else if ( creep.memory.target_id === false || creep.memory.target_id === '59f1a59182100e1594f3eb85' || creep.memory.target_id === '5a3c2abd58995a60a7cbb724') {
            //         let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_ROAD || object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < 400000&& object.hits/object.hitsMax <= 0.8 && object.id !== '5a8fbd6625e0a771c366de93'});
            //         if (target) {
            //             creep.memory.target_id = target.id
            //             creep.memory.role = 'repair_civilian';
            //         } else {
            //             creep.memory.target_id = '59f1a59182100e1594f3eb85'
            //             creep.memory.role = 'upgrade';
            //         }
            //         // let targets = Game.rooms['E38N49'].find(FIND_STRUCTURES, {filter: object => (object.structureType == STRUCTURE_ROAD || object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_TOWER || object.structureType == STRUCTURE_CONTAINER) && object.hits < object.hitsMax && object.id !== '5a8fbd6625e0a771c366de93'});
            //         // targets.sort((a,b) => a.hits - b.hits);
            //         // if (targets) creep.memory.target_id = targets[0].id
            //     }
            // }
        } else if (creep.name === 'max_new1' || creep.name === 'max_new2' || creep.name === 'max_new3' || creep.name === 'max_new4'|| creep.name === 'max_new5'|| creep.name === 'max_new6' || creep.name === 'max_new7') {
            if (creep.memory.target_id == false || creep.memory.target_id === '5a3c2abd58995a60a7cbb724') {
                let towers = Game.rooms['E38N49'].find(FIND_MY_STRUCTURES, {filter: object => (((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN) && (object.energy < object.energyCapacity)) || (object.structureType === STRUCTURE_TOWER && (object.energy/object.energyCapacity < 0.8)))});
                if (towers && towers.length > 0) {
                    creep.memory.target_id = towers[0].id;
                    creep.memory.role = 'transfer';
                } else {
                    creep.memory.target_id = '59f1a59182100e1594f3eb85'
                    creep.memory.role = 'upgrade';
                }
            }
        } else if ((creep.pos.getRangeTo(Game.rooms[room_name].controller) < 4) || ((units['E39N49']['upgrade'] < 2) && (units['E39N49']['total'] > 3) && (creep.ticksToLive > 1300))) {
            if (creep.memory.role !== 'upgrade') creep.say('upgrading');
            creep.memory.role = 'upgrade';
        } else if (condition2change_role) {
            var current_workers = units[room_name]['total']; // - units[room_name]['harvest'];
            var current_creep_types = global_vars.creep_types[global_vars.status];
            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: CREEP_TYPES: ' + JSON.stringify(current_creep_types));
            //TODO: Improve pleace of tower. don't search per creep
            transfer_target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: object => (object.structureType === STRUCTURE_TOWER && (object.energy/object.energyCapacity < 0.8))});
            if (!transfer_target) {
                transfer_target = Game.getObjectById(Game.rooms[room_name].memory.energy_flow.links.source);
                if (!(transfer_target && (transfer_target.energy/transfer_target.energyCapacity < 0.9))) {
                    transfer_target = creep.pos.findClosestByRange(FIND_STRUCTURES,
                        {filter: object => ((object.structureType === STRUCTURE_EXTENSION || object.structureType === STRUCTURE_SPAWN)
                        && (object.energy < object.energyCapacity))});
                    // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFERS targets: ' + targets.length + '; current TRANSFER %: ' + units[room_name]['transfer']/current_workers + '; limit: '+ current_creep_types.transfer[my_room.controller.level]);
                }
            }
            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: TRANSFER TARGET: ' + JSON.stringify(transfer_target));
            if ((transfer_target && (units[room_name]['transfer']/current_workers < current_creep_types.transfer[my_room.controller.level]))) {
                creep.say('transfering');
                creep.memory.role = 'transfer';
//                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: changed to TRANSFER');
                //units[room_name].transfer++;
            } else if (my_room.memory.targets.repair_defence && units[room_name]['repair_defence']/current_workers < current_creep_types.repair_defence) {
                console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: Changed ' + creep.memory.role + ' to repair_defence: ' + units[room_name]['repair_defence'] + ' / ' + current_workers + '=' + units[room_name]['repair_defence']/current_workers + '[' + current_creep_types.repair_defence +']')
                creep.say('defence repair');
                creep.memory.role = 'repair_defence';
                //units[room_name].repair_defence++;
            } else if (my_room.memory.targets.repair_civilian && units[room_name]['repair_civilian']/current_workers < current_creep_types.repair_civilian) {
                creep.say('civilian repair');
                creep.memory.role = 'repair_civilian';
                //units[room_name].repair_civilian++;
            } else if (my_room.memory.targets.build && units[room_name]['build']/current_workers < current_creep_types.build) {
                creep.say('building');
                creep.memory.role = 'build';
                units[room_name].build++;
            } else { // if (creep.ticksToLive > 1400) {  // Here if no jobs instead upgrading
                creep.say('upgrading');
                creep.memory.role = 'upgrade';
                //units[room_name].upgrade++;
                // } else {
                //     creep.say('harvesting');
                //     creep.memory.role = 'harvest';
            }
            // }
            // console.log('[DEBUG] (structCreep.run)[' + creep.name + ']: CHANGED ROLE: ' + JSON.stringify(creep.memory));
            creep.memory.target_id = false;
        }

        // Action per role
        let creep_role = creep.memory.role;
        switch(creep_role) {
            case 'harvest':
                role_harvester.run(creep, iam_general);
                break;
            case 'miner':
                role_miner.run(creep);
                break;
            case 'transfer':
                let cur_transfer_target = (creep.memory.target_id) ? Game.getObjectById(creep.memory.target_id) : transfer_target;
                // console.log('[DEBUG] (structCreep-transfer)[' + creep.name + ']: Target: ' + JSON.stringify(cur_transfer_target) + '; Found Target: ' + JSON.stringify(transfer_target));
                creep.memory.target_id = cur_transfer_target.id;
                let energy_missing = cur_transfer_target.energyCapacity - cur_transfer_target.energy;
                let energy2transfer = (energy_missing < creep.carry[RESOURCE_ENERGY] ? energy_missing : creep.carry[RESOURCE_ENERGY]);
                let act_response = creep.transfer(cur_transfer_target, RESOURCE_ENERGY, energy2transfer);
                creep_helpers.most_creep_action_results(creep, cur_transfer_target, act_response, creep_role);
                break;
            case 'repair_defence':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_defence));
                if (target && target.hits < target.hitsMax) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'repair_civilian':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.repair_civilian));
                // var target = Game.getObjectById(my_room.memory.targets.repair_civilian); // the most targets are roads => stuck on them
                if (target && target.hits/target.hitsMax <= 0.8) {
                    creep_helpers.most_creep_action_results(creep, target, creep.repair(target), creep_role);
                } else {
                    creep.memory.role = 'undefined';
                    creep.memory.target_id = false;
                }
                break;
            case 'build':
                //console.log(creep.name + '-MemBuild: ' + JSON.stringify(my_room.memory.targets.build[0].id));
                //var target = creep.pos.findClosestByRange(my_room.memory.targets.build);
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : Game.getObjectById(my_room.memory.targets.build));
                //console.log(creep.name + '-Build: ' + target.id);
                if (target) {
                    var action_res = creep.build(target);
                    // console.log('[DEBUG] (structCreep-build)[' + creep.name + ']: Target: ' + JSON.stringify(target.id) + '; ACTION_RES: ' + action_res);
                    switch(action_res) {
                        case ERR_INVALID_TARGET:    // possible problem: if creep on the square remove structure from list
                            my_room.memory.targets.build = false;
                            creep.memory.role = 'undefined';
                            creep.memory.target_id = false;
                            break;
                        default:
                            creep_helpers.most_creep_action_results(creep, target, action_res, creep_role);
                            creep.memory.target_id = false;
                    }
                } else creep.memory.role = 'undefined';
                break;
            case 'upgrade':
                var target = (creep.memory.target_id ? Game.getObjectById(creep.memory.target_id) : creep.room.controller);
                if (target) {
                    creep_helpers.most_creep_action_results(creep, target, creep.upgradeController(target), creep_role);
                } else creep.memory.role = 'undefined';
                break;
            case 'dropper':
                let closest_containers = Game.getObjectById(creep.memory.target_id);
                if (creep.pos.getRangeTo(closest_containers) == 0) {
                    creep.drop(RESOURCE_ENERGY);
                } else creep.moveTo(closest_containers, global_vars.moveTo_ops);
                break;
            case 'claimer':
                // let action_out = creep.moveTo(Game.getObjectById('59f1a59182100e1594f3eb87'), global_vars.moveTo_ops);
                // let action_out = creep.moveTo(new RoomPosition(37, 21, 'E38N48'), global_vars.moveTo_ops);
                // let action_out = creep.reserveController(creep.room.controller); //Game.getObjectById('5ab2b2a5c9848656de6fedac'))
                // console.log('[ERROR]: Clamer ' + creep.name + '; out: ' + action_out);
                break;
            default:
                console.log('[ERROR]: No role defined for ' + creep.name + '; ROLE: ' + creep_role);
        }

        {    // HARVEST

            //console.log('Source:' + source);
            //return [source.pos.x, source.pos.y];
        }
    }
};

module.exports = structCreep;
