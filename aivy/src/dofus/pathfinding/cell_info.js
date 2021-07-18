class CellInfo {
    constructor(cell, mapPoint) {
        this.cell = cell;
        this.mapPoint = mapPoint;
        this.id = this.cell.id;
        this.parent = this;
        this.available = this.cell.mov;
        if(!this.available) {
            if(this.cell.non_walkable_during_fight) {
                this.available = false;
            }
        }
        this.x = mapPoint.x;
        this.y = mapPoint.y;
        this.f = 0;
        this.g = 0;
        this.h = 0;
    }
}

module.exports = CellInfo;