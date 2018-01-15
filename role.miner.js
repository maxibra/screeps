
//Game.spawns['max'].spawnCreep([WORK,WORK,WORK,WORK,WORK,MOVE], 'test', {special: 'special_miner', role: 'miner', target_id: '5a5a97ed9af56273766ddebd'})

function RoleMiner(creep) {
    this.creep = creep;
}

RoleMiner.prototype.run = function() {
    let container_target = Game.getObjectById(this.creep.memory.target_id);
    let harvest_target = Game.getObjectById(this.creep.room.memory.energy_flow.containers.source[container.id]);
    let action_out = this.creep.harvest(harvest_target);
    if (action_out === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(container_target, global_vars.moveTo_ops);
    }
};

module.exports = RoleMiner;
