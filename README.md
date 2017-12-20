# screeps
## Until 28/12/16:
* Create first roads
* Create line of extensions by controller level
* Change role of harvesters to builder and back
* Increase Body with EnergyCapability
  * Base body: [WORK,CARRY,MOVE]
  * Additional part of Body: [WORK,CARRY]
  * Add move after every 2 additional parts

## 19-20/12 2017:
* increase/decrease creeps amount by time ans status of build or repair defence
* Creep continue to work with the same target until the target is full or creeps is empty.
* Choose role of creep by finish of harvesting
* Change role of creep to 'undefine' if finish to work with a target but still has energy.
* Create repair roles: repair_defence and repair_civilian
* Builders prefer to build extensions and defence units
* Rewriting create creep: change harvesters to transfer to feel energy

## TBD:
* Create the better way to search source to harvest
    * choose free source and don't change it
    * if all sources are busy:
        * find source with more points to harvest
        * try to predict when the source will be free by how match energy a nearest harvesters are need
* Create system based on memory to save path from each requested point.
