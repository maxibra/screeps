# screeps
## Until 28/12/16:
* Create first roads
* Create line of extensions by controller level
* Change role of harvesters to builder and back
* Increase Body with EnergyCapability
  * Base body: [WORK,CARRY,MOVE]
  * Additional part of Body: [WORK,CARRY]
  * Add move after every 2 additional parts

## TBD:
* Rewrite increase/decrease builders amount if need to complete extensions
* Implement Harvester continue to next transfer if contains energy (currently is back to source with energy)
* Change role of builders to upgraders (Be careful with transformed harvesters)
* Add repearing of roads to role of builder
* Improve Transfers (choose a new target if remained energy. Currently choose spawn)
* Transfers. possibility to change percent of transfers if not enought creeps for more then hour
* Improve change role. currently if in the same ticket several creeps are needed to change role we have a wrong proportion
