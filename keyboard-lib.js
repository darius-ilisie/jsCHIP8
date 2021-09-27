class KeyboardArray {
    constructor() {
        this.ks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var kb = [];
            kb[54] = 0x1;
            kb[53] = 0x2;
            kb[54] = 0x3;
            kb[82] = 0x4;
            kb[84] = 0x5;
            kb[89] = 0x6;
            kb[70] = 0x7;
            kb[71] = 0x8;
            kb[72] = 0x9;
            kb[86] = 0xa;
            kb[66] = 0x0;
            kb[78] = 0xb;
            kb[55] = 0xc;
            kb[85] = 0xd;
            kb[74] = 0xe;
            kb[77] = 0xf;
        this.kb = kb;
    }

    async keyU(e) {
        console.log(e);
        this.ks[this.kb[e.keyCode]] = 0;
    }

    async keyD(e) {
        console.log(e);
        this.ks[this.kb[e.keyCode]] = 1;
    }
}