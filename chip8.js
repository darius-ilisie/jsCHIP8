class CHIP8 {
    constructor(r) {
        this.gfxLib = new GraphicsLibrary(64 * r, 32 * r);
        this.gfxLib.setBackgroundGreyscale(0);

        this.mem = new Uint8Array(0x1000);
        this._load_fontset();

        this.vscreen = [];
        for (var i = 0; i < 2048; i++) {
            this.vscreen[i] = 0;
        }

        this.V = [];
        for (var i = 0; i < 16; i++) {
            this.V[i] = 0;
        }

        this.I = 0x0;
        this.PC = 0x0;
        this.SP = 0x0;
        this.st = new Uint16Array(16);

        this.pix_ratio = r;
        this.DEBUG = true;

        this.run = [];
        
        this.run[0x0] = async (opcode) => {
            if ((opcode & 0x00FF) == 0xe0) { //CLS
                if (this.DEBUG == true) {
                    console.log("[+] Exec CLS opcode: " + opcode.toString(16));
                }
                this.gfxLib.setBackgroundGreyscale(0);

                for (var i = 0; i < 2048; i++) {
                    this.vscreen[i] = 0;
                }

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0xee) { //RET
                if (this.DEBUG == true) {
                    console.log("[+] Exec RET opcode: " + opcode.toString(16));
                }
                this.PC = this.st[--this.SP];

                this.st[this.SP] = 0x0;
            } else {
                this._undef(opcode);
            }
        }

        this.run[0x1] = async (opcode) => { //JP addr
            if (this.DEBUG == true) {
                console.log("[+] Exec JP opcode: " + opcode.toString(16));
            }

            this.PC = opcode & 0x0FFF;
        }

        this.run[0x2] = async (opcode) => { //CALL addr
            if (this.DEBUG == true) {
                console.log("[+] Exec CALL opcode: " + opcode.toString(16));
            }
            this.st[this.SP] = this.PC+2;
            this.SP++;

            this.PC = opcode & 0x0FFF;
        }

        this.run[0x3] = async (opcode) => { //SE Vx, byte
            if (this.DEBUG == true) {
                console.log("[+] Exec SE opcode: " + opcode.toString(16));
            }
            var x = (opcode & 0x0F00) >> 8;
            var byte = opcode & 0x00FF;

            if (this.V[x] == byte) {
                this.PC += 4;
            } else {
                this.PC += 2;
            }
        }

        this.run[0x4] = async (opcode) => { //SNE Vx, byte
            if (this.DEBUG == true) {
                console.log("[+] Exec SNE opcode: " + opcode.toString(16));
            }
            var x = (opcode & 0x0F00) >> 8;
            var byte = opcode & 0x00FF;

            if (this.V[x] != byte) {
                this.PC += 4;
            } else {
                this.PC += 2;
            }
        }

        this.run[0x5] = async (opcode) => { //SE Vx, Vy
            if (opcode & 0x000F == 0) {
                if (this.DEBUG == true) {
                    console.log("[+] Exec SE opcode: " + opcode.toString(16));
                }
                if (this.V[(opcode & 0x0F00) >> 8] == this.V[(opcode & 0x00F0) >> 4])
                    this.PC += 4;
                else
                    this.PC += 2;
            } else {
                this._undef(opcode);
            }
        }

        this.run[0x6] = async (opcode) => { //LD Vx, byte
            if (this.DEBUG == true) {
                console.log("[+] Exec LD opcode: " + opcode.toString(16));
            }
            this.V[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;

            this.PC += 2;
        }

        this.run[0x7] = async (opcode) => { //ADD Vx, byte
            if (this.DEBUG == true) {
                console.log("[+] Exec ADD opcode: " + opcode.toString(16));
            }
            var x = (opcode & 0x0F00) >> 8;
            var old = this.V[x];

            this.V[x] = (this.V[x] + (opcode & 0x00FF)) & 0x00FF;
            this.PC += 2;
            if (old > this.V[x]) {
                console.log("[!] Memory overflow!");
            }
        }

        this.run[0x8] = async (opcode) => {
            var x = (opcode & 0x0F00) >> 8;
            var y = (opcode & 0x00F0) >> 4;
            if (opcode & 0x000F == 0x0) { //LD Vx, Vy
                this.V[x] = this.V[y];

                this.PC += 2;
            } else if (opcode & 0x000F == 0x1) { //OR Vx, Vy
                this.V[x] = (this.V[x] | this.V[y]) & 0x00FF;

                this.PC += 2;
            } else if (opcode & 0x000F == 0x2) { //AND Vx, Vy
                this.V[x] = (this.V[x] & this.V[y]) & 0x00FF;

                this.PC += 2;
            } else if (opcode & 0x000F == 0x3) { //XOR Vx, Vy
                this.V[x] = (this.V[x] ^ this.V[y]) & 0x00FF;

                this.PC += 2;
            } else if (opcode & 0x000F == 0x4) { //ADD Vx, Vy
                this.V[0xF] = 0;
                var old = this.V[x];

                this.V[x] = (this.V[x] + this.V[y]) & 0x00FF;

                this.PC += 2;
                if (old > this.V[x]) {
                    console.log("[!] Memory overflow! Setting VF=carry");
                    this.V[0xF] = 1;
                }
            } else {
                this._undef(opcode);
            }
        }

        this.run[0x9] = async (opcode) => { //SNE Vx, Vy
            if (opcode & 0x000F == 0) {
                if (this.DEBUG == true) {
                    console.log("[+] Exec SE opcode: " + opcode.toString(16));
                }
                if (this.V[(opcode & 0x0F00) >> 8] != this.V[(opcode & 0x00F0) >> 4])
                    this.PC += 4;
                else
                    this.PC += 2;
            } else {
                this._undef(opcode);
            }
        }

        this.run[0xA] = async (opcode) => { //LD I, addr
            if (this.DEBUG == true) {
                console.log("[+] Exec LD I opcode: " + opcode.toString(16));
            }
            this.I = opcode & 0x0FFF;

            this.PC += 2;
        }

        this.run[0xB] = async (opcode) => { //JP V0, addr
            if (this.DEBUG == true) {
                console.log("[+] Exec JP opcode: " + opcode.toString(16));
            }

            this.PC = ((opcode & 0x0FFF) + this.V[0]) & 0xFFFF;
            if ((opcode & 0x0FFF) > this.PC) {
                console.log("[!] Memory overflow!");
            }
        }

        this.run[0xC] = async (opcode) => { //RND Vx, byte
            if (this.DEBUG == true) {
                console.log("[+] Exec RND opcode: " + opcode.toString(16));
            }
            this.V[(opcode & 0x0F00) >> 8] = Math.floor(Math.random() * 0x100) & (opcode & 0x00FF);

            this.PC += 2;
        }

        this.run[0xD] = async (opcode) => { //DRW Vx, Vy, nibble
            if (this.DEBUG == true) {
                console.log("[+] Exec DRW opcode: " + opcode.toString(16));
            }
            var x = this.V[(opcode & 0x0F00) >> 8];
            var y = this.V[(opcode & 0x00F0) >> 4];
            var n = opcode & 0x000F;

            var p;
            this.V[0xF] = 0;
            for (var i = 0; i < n; i++) {
                p = this.mem[this.I + i];
                for (var j = 0; j < 8; j++) {
                    if ((p & (0x80 >> j)) != 0) {
                        if (this.vscreen[(x + j + ((y + i) * 64))] == 1) {
                            this.V[0xF] = 1;
                        }
                        this.vscreen[x + j + ((y + i) * 64)] ^= 1;
                    }
                }
            }

            this._draw_canvas();
            this.PC += 2;
        }

        this.run[0xF] = async (opcode) => {
            //   54  53  54  55
            //   82  84  89  85
            //   70  71  72  74
            //   86  66  78  77
            

            if ((opcode & 0x00FF) == 0x07) { //LD Vx, DT
                if (this.DEBUG == true) {
                    console.log("[+] Exec LD DT opcode: " + opcode.toString(16));
                    console.log("[!] No DT implemented, skiping!");
                }
                this.V[(opcode & 0x0F00) >> 8] = 0x0;

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0x0a) {
                if (this.DEBUG == true) { 
                    console.log("[+] Exec LD K opcode: " + opcode.toString(16));
                }
                for(var i = 0; i < 16; i++) {
                    if(kb.ks[i] != 0) {
                        this.V[(opcode & 0x0F00) >> 8] = i;
                        this.PC += 2;
                        break;
                    }
                }
                
            } else if ((opcode & 0x00FF) == 0x1e) { //ADD I, Vx
                if (this.DEBUG == true) {
                    console.log("[+] Exec ADD opcode: " + opcode.toString(16));
                }
                this.I = (this.V[(opcode & 0x0F00) >> 8] + this.I) & 0xFFFF;

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0x29) { //LD F, Vx
                if (this.DEBUG == true) {
                    console.log("[+] Exec LD F opcode: " + opcode.toString(16));
                }
                this.I = this.V[(opcode & 0x0F00) >> 8] * 0x5

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0x33) { //LD B, Vx
                if (this.DEBUG == true) {
                    console.log("[+] Exec LD B opcode: " + opcode.toString(16));
                }

                var t = this.V[(opcode & 0x0F00) >> 8];

                var h = Math.floor(t / 100) % 10;
                var z = Math.floor(t / 10) % 10;
                var d = t % 10;

                this.mem[this.I] = h;
                this.mem[this.I + 1] = z;
                this.mem[this.I + 2] = d;

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0x55) { //LD [I], Vx
                if (this.DEBUG == true) {
                    console.log("[+] Exec LD [I] opcode: " + opcode.toString(16));
                }
                for (var i = 0; i <= (opcode & 0x0F00) >> 8; i++) {
                    this.mem[this.I + i] = this.V[i];
                }

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0x65) { //LD Vx, [I]
                if (this.DEBUG == true) {
                    console.log("[+] Exec LD [I] opcode: " + opcode.toString(16));
                }
                for (var i = 0; i <= (opcode & 0x0F00) >> 8; i++) {
                    this.V[i] = this.mem[this.I + i];
                }

                this.PC += 2;
            } else {
                this._undef(opcode);
            }
        }
    }

    _load_fontset() {
        var fontset =
            [
                0xF0, 0x90, 0x90, 0x90, 0xF0, //0
                0x20, 0x60, 0x20, 0x20, 0x70, //1
                0xF0, 0x10, 0xF0, 0x80, 0xF0, //2
                0xF0, 0x10, 0xF0, 0x10, 0xF0, //3
                0x90, 0x90, 0xF0, 0x10, 0x10, //4
                0xF0, 0x80, 0xF0, 0x10, 0xF0, //5
                0xF0, 0x80, 0xF0, 0x90, 0xF0, //6
                0xF0, 0x10, 0x20, 0x40, 0x40, //7
                0xF0, 0x90, 0xF0, 0x90, 0xF0, //8
                0xF0, 0x90, 0xF0, 0x10, 0xF0, //9
                0xF0, 0x90, 0xF0, 0x90, 0x90, //A
                0xE0, 0x90, 0xE0, 0x90, 0xE0, //B
                0xF0, 0x80, 0x80, 0x80, 0xF0, //C
                0xE0, 0x90, 0x90, 0x90, 0xE0, //D
                0xF0, 0x80, 0xF0, 0x80, 0xF0, //E
                0xF0, 0x80, 0xF0, 0x80, 0x80  //F
            ];
        fontset.forEach((e, i) => {
            this.mem[i] = e;
        })
    }

    async _load_rom() {
        const _r = await new Promise((resolve, reject) => {
            if (document.getElementById('rom').files[0] == undefined) {
                console.log("[-] No rom selected! Select a rom then try again.");
                reject("[-] No ROM (E001)");
            } else {
                var file = document.getElementById('rom').files[0];
                var fr = new FileReader();

                fr.onload = res => {
                    resolve(res.target.result);
                };

                fr.onerror = err => reject(err);

                fr.readAsArrayBuffer(file);
            }
        });
        var tmp_rom = new Uint8Array(_r);
        tmp_rom.forEach((e, i) => {
            this.mem[i + 0x200] = e;
        });
    }

    async init() {
        //Clear memory
        await this.clear();

        //Load rom in memory
        await this._load_rom();

        //Setting PC to start of the program
        this.PC = 0x200;

        var t = this;
        this.int = setInterval(async function () { await t.step() }, 1000 / 700);
    }

    async step() {   
        var opcode = this._bytes_to_numberBE(this._read_mem(this.PC));
        await this.run[(opcode & 0xF000) >> 12](opcode);
    }

    async stop() {
        clearInterval(this.int);
    }

    async clear() {
        for(var i = 0x200; i < 0x1000; i++) {
            this.mem[i] = 0x0;
        }
        for (var i = 0; i < 2048; i++) {
            this.vscreen[i] = 0;
        }
        for (var i = 0; i < 16; i++) {
            this.V[i] = 0;
        }

        this.I = 0x0;
        this.PC = 0x0;
        this.SP = 0x0;
        this.st = new Uint16Array(16);
    }

    _read_mem(pos) {
        return [this.mem[pos], this.mem[pos + 1]];
    }

    _bytes_to_numberBE(arr) {
        return (arr[0] * 0x100 + arr[1]);
    }

    _draw_canvas() {
        var cl = [];

        cl[0] = 0;
        cl[1] = 255;
        for (var y = 0; y < this.pix_ratio * 32; y++) { //IT WORKS! :#
            for (var x = 0; x < this.pix_ratio * 64; x++) {
                this.gfxLib.setPixelDataGreyscale(x, y, cl[this.vscreen[Math.floor(y / this.pix_ratio) * 64 + Math.floor(x / this.pix_ratio)]]);
            }
        }

        this.gfxLib.updatePixelData();
    }

    _undef(op) {
        console.log("[-] Unimplemented opcode: " + op.toString(16));
        clearInterval(this.int);
    }
}

var kb = new KeyboardArray();
document.addEventListener("keydown", (e) => {kb.ks[kb.kb[e.keyCode]]=1,console.log(kb.ks[kb.kb[e.keyCode]])});
document.addEventListener("keyup", (e) => {kb.ks[kb.kb[e.keyCode]]=0});
var p = new CHIP8(12)