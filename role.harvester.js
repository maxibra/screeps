var creep_helpers = require('creep_helpers');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        // Initialize harvester state if needed
        if (!creep.memory.harvesting) {
            creep.memory.harvesting = true;
        }

        // Switch between harvesting and delivering based on energy levels
        if (creep.memory.harvesting && creep.store.getFreeCapacity() === 0) {
            creep.memory.harvesting = false;
            creep.say('🚚 deliver');
        }
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.harvesting = true;
            creep.say('🔄 harvest');
        }

        if (creep.memory.harvesting) {
            this.harvestEnergy(creep);
        } else {
            this.deliverEnergy(creep);
        }
    },

    harvestEnergy: function(creep) {
        let target = null;

        // Try to use cached target first
        if (creep.memory.target_id) {
            target = Game.getObjectById(creep.memory.target_id);
            // Clear cache if target is invalid or empty
            if (!target || (target.energy === 0 && target.structureType !== STRUCTURE_SOURCE)) {
                creep.memory.target_id = null;
                target = null;
            }
        }

        // Find new target if needed
        if (!target) {
            target = this.findBestHarvestTarget(creep);
            if (target) {
                creep.memory.target_id = target.id;
            }
        }

        if (target) {
            let result = creep.harvest(target);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: {stroke: '#ffaa00'},
                    reusePath: Memory.rooms.global_vars?.moveTo_ops?.reusePath || 15
                });
            } else if (result === ERR_NOT_ENOUGH_RESOURCES) {
                // Source is empty, clear cache and find new target
                creep.memory.target_id = null;
            }
        } else {
            // No energy sources available, move to wait position or help with other tasks
            this.fallbackBehavior(creep);
        }
    },

    findBestHarvestTarget: function(creep) {
        let targets = [];

        // Priority 1: Dropped energy (free resources)
        let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: resource => resource.resourceType === RESOURCE_ENERGY && resource.amount > 50
        });

        if (droppedEnergy.length > 0) {
            return creep.pos.findClosestByRange(droppedEnergy);
        }

        // Priority 2: Containers and ruins with energy
        let containers = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (structure.structureType === STRUCTURE_CONTAINER ||
                        structure.structureType === STRUCTURE_STORAGE) &&
                       structure.store[RESOURCE_ENERGY] > 0;
            }
        });

        let ruins = creep.room.find(FIND_RUINS, {
            filter: ruin => ruin.store[RESOURCE_ENERGY] > 0
        });

        targets = targets.concat(containers, ruins);

        // Priority 3: Energy sources
        let sources = creep.room.find(FIND_SOURCES, {
            filter: source => source.energy > 0
        });

        targets = targets.concat(sources);

        if (targets.length === 0) return null;

        // Find the best target based on distance and energy amount
        return this.selectOptimalTarget(creep, targets);
    },

    selectOptimalTarget: function(creep, targets) {
        if (targets.length === 1) return targets[0];

        let scoredTargets = targets.map(target => {
            let distance = creep.pos.getRangeTo(target);
            let energy = target.energy || target.store[RESOURCE_ENERGY] || target.amount || 0;

            // Score based on energy per distance ratio, with bonus for closer targets
            let score = energy / (distance + 1);

            // Bonus for sources (renewable)
            if (target.structureType === undefined && target.energy !== undefined) {
                score *= 1.5;
            }

            return { target: target, score: score };
        });

        // Sort by score descending
        scoredTargets.sort((a, b) => b.score - a.score);
        return scoredTargets[0].target;
    },

    deliverEnergy: function(creep) {
        let target = null;

        // Try cached target first
        if (creep.memory.delivery_target_id) {
            target = Game.getObjectById(creep.memory.delivery_target_id);
            // Clear cache if target is full or invalid
            if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.delivery_target_id = null;
                target = null;
            }
        }

        // Find new delivery target
        if (!target) {
            target = this.findBestDeliveryTarget(creep);
            if (target) {
                creep.memory.delivery_target_id = target.id;
            }
        }

        if (target) {
            let result = creep.transfer(target, RESOURCE_ENERGY);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: {stroke: '#ffffff'},
                    reusePath: Memory.rooms.global_vars?.moveTo_ops?.reusePath || 15
                });
            } else if (result === ERR_FULL) {
                // Target is full, clear cache
                creep.memory.delivery_target_id = null;
            }
        } else {
            // No delivery targets, perhaps upgrade controller
            this.upgradeController(creep);
        }
    },

    findBestDeliveryTarget: function(creep) {
        let targets = [];

        // Priority 1: Spawns and extensions (critical for creep production)
        let spawnTargets = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN) &&
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        if (spawnTargets.length > 0) {
            return creep.pos.findClosestByRange(spawnTargets);
        }

        // Priority 2: Towers (for defense)
        let towers = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return structure.structureType === STRUCTURE_TOWER &&
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                       structure.store[RESOURCE_ENERGY] < structure.store.getCapacity(RESOURCE_ENERGY) * 0.9;
            }
        });

        if (towers.length > 0) {
            return creep.pos.findClosestByRange(towers);
        }

        // Priority 3: Storage and containers
        targets = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (structure.structureType === STRUCTURE_CONTAINER ||
                        structure.structureType === STRUCTURE_STORAGE) &&
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        if (targets.length > 0) {
            return creep.pos.findClosestByRange(targets);
        }

        return null;
    },

    upgradeController: function(creep) {
        if (creep.room.controller) {
            let result = creep.upgradeController(creep.room.controller);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {
                    visualizePathStyle: {stroke: '#ffffff'},
                    reusePath: Memory.rooms.global_vars?.moveTo_ops?.reusePath || 15
                });
            }
        }
    },

    fallbackBehavior: function(creep) {
        // If no energy sources, help with construction or repair
        let constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0 && creep.store[RESOURCE_ENERGY] > 0) {
            let target = creep.pos.findClosestByRange(constructionSites);
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }

        // Or help repair structures
        let damagedStructures = creep.room.find(FIND_STRUCTURES, {
            filter: structure => structure.hits < structure.hitsMax &&
                                structure.structureType !== STRUCTURE_WALL &&
                                structure.structureType !== STRUCTURE_RAMPART
        });

        if (damagedStructures.length > 0 && creep.store[RESOURCE_ENERGY] > 0) {
            let target = creep.pos.findClosestByRange(damagedStructures);
            if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }

        // Otherwise, move to a safe waiting position (near spawn)
        let spawn = creep.room.find(FIND_MY_SPAWNS)[0];
        if (spawn && creep.pos.getRangeTo(spawn) > 3) {
            creep.moveTo(spawn);
        }
    },

    // Special method for remote harvesting integration
    runRemote: function(creep) {
        if (creep.memory.source_id && creep.memory.homeland_destinations) {
            // Remote harvesting logic
            this.remoteHarvestAndDeliver(creep);
        } else {
            // Fallback to local harvesting
            this.run(creep);
        }
    },

    remoteHarvestAndDeliver: function(creep) {
        let source = Game.getObjectById(creep.memory.source_id);

        if (!creep.memory.harvesting) {
            creep.memory.harvesting = true;
        }

        if (creep.memory.harvesting && creep.store.getFreeCapacity() === 0) {
            creep.memory.harvesting = false;
        }
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.harvesting = true;
        }

        if (creep.memory.harvesting) {
            if (source && source.energy > 0) {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        } else {
            // Return to homeland to deliver
            let destinations = creep.memory.homeland_destinations;
            if (destinations && destinations.length > 0) {
                let target = Game.getObjectById(destinations[0]);
                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }
            }
        }
    }
};

module.exports = roleHarvester;
