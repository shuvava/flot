import Canvas from './canvas';

class CanvasFactory {
    constructor() {
        this.Canvas = Canvas;
    }

    createInstance(...args) {
        return new this.Canvas(...args);
    }
}

const canvasFactory = new CanvasFactory();

export default canvasFactory;
