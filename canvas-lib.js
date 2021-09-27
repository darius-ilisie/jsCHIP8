class GraphicsLibrary {
    constructor(w, h) {
        var body = document.getElementsByTagName('body')[0];
        var node = document.createElement("canvas");

        node.setAttribute("width", w)
        node.setAttribute("height", h)
        node.setAttribute("id", "main");

        body.appendChild(node);

        this.w = w;
        this.h = h;

        var context = node.getContext("2d");
        var imgData = context.createImageData(w, h);

        this.imgData = imgData;
        this.ctx = context;
    }

    setPixelData(x, y, r, g, b, a) {
        var index = 4 * (x + y * this.w);
        this.imgData.data[index] = r;
        this.imgData.data[index+1] = g;
        this.imgData.data[index+2] = b;
    
        this.imgData.data[index+3] = a;
    }
    
    setPixelDataGreyscale(x, y, g) {
        var index = 4 * (x + y * this.w);
        this.imgData.data[index] = g;
        this.imgData.data[index+1] = g;
        this.imgData.data[index+2] = g;
    
        this.imgData.data[index+3] = 255;
    }

    setBackground(r, g, b, a) {
        for(var x = 0; x < this.w; x++) {
            for(var y = 0; y < this.h; y++) {
                var index = 4 * (x + y * this.w);
                this.imgData.data[index] = r;
                this.imgData.data[index+1] = g;
                this.imgData.data[index+2] = b;
    
                this.imgData.data[index+3] = a;
            }
        }
    
        this.ctx.putImageData(this.imgData, 0, 0);
    }
    
    setBackgroundGreyscale(g) {
        for(var x = 0; x < this.w; x++) {
            for(var y = 0; y < this.h; y++) {
                var index = 4 * (x + y * this.w);
                this.imgData.data[index] = g;
                this.imgData.data[index+1] = g;
                this.imgData.data[index+2] = g;
    
                this.imgData.data[index+3] = 255;
            }
        }
    
        this.ctx.putImageData(this.imgData, 0, 0);
    }
    
    updatePixelData() {
        this.ctx.putImageData(this.imgData, 0, 0);
    }
}