class GameMap extends AcGameObject {
    constructor(playground){
        super();
        this.playground=playground;
        this.$canvas = $(`
        <canvas></canvas>
            `);
        this.ctx=this.$canvas[0].getContext('2d');

    }
}
