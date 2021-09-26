var inter;
var rom;

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
]

async function Csetup() {
    //Check for file or die
    if (document.getElementById('rom').files[0] == undefined) {
        console.log("[-] No file selected! Please select a file before starting the program.")
        return;
    }
    var n = parseInt(document.getElementById('canvas_size').value);
    document.getElementById('canvas_size').setAttribute("disabled", "");
    setup(n);
    background(0);

    //Read rom from file
    rom = await readROM();

    inter = new CHIP8(n);

    //Tmp dbg
    document.getElementById('body').setAttribute("onkeypress","inter.start()");

    inter.init();
}

function readROM() {
    return new Promise((resolve, reject) => {
        var file = document.getElementById('rom').files[0];
        var fr = new FileReader();

        fr.onload = res => {
            resolve(res.target.result);
        };

        fr.onerror = err => reject(err);

        fr.readAsArrayBuffer(file);
    })

}

function setup(n) {
    createCanvas(64 * n, 32 * n);
}

class CHIP8 {
    constructor(r) {
        this.mem = new Uint8Array(0x1000);
        fontset.forEach((e, i) => {
            this.mem[i] = e;
        })

        this.vscreen = [];
        for(var i = 0; i < 2048; i++) {
            this.vscreen[i] = 0;
        }

        this.V = [];
        for(var i = 0; i < 16; i++) {
            this.V[i] = 0;
        }

        this.I = 0x0;
        this.PC = 0x0;
        this.SP = 0x0;
        this.st = new Uint16Array(16);

        this.pix_ratio = r;
        this.DEBUG = true;

        this.run = [];

        //Template
        /*this.run[0x0000] = (opcode) => {
            
        }*/
        this.run[0x0] = (opcode) => {
            if ((opcode & 0x00FF) == 0xe0) { //CLS
                if (this.DEBUG == true) {
                    console.log("[+] Exec CLS opcode: " + opcode.toString(16));
                }
                clear();
                background(0);

                for(var i = 0; i < 2048; i++) {
                    this.vscreen[i] = 0;
                }

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0xee) { //RET
                if (this.DEBUG == true) {
                    console.log("[+] Exec RET opcode: " + opcode.toString(16));
                }
                this.PC = this.st[this.SP];

                this.st[this.SP] = 0x0;
                this.SP--;
            } else {
                this._undef(opcode);
            }
        }

        this.run[0x1] = (opcode) => { //JP addr
            if (this.DEBUG == true) {
                console.log("[+] Exec JP opcode: " + opcode.toString(16));
            }
            
            this.PC = opcode & 0x0FFF;
        }

        this.run[0x6] = (opcode) => { //LD Vx, byte
            if (this.DEBUG == true) {
                console.log("[+] Exec LD opcode: " + opcode.toString(16));
            }
            this.V[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;

            this.PC+=2;
        }

        this.run[0xA] = (opcode) => { //LD I, addr
            if (this.DEBUG == true) {
                console.log("[+] Exec LD I opcode: " + opcode.toString(16));
            }
            this.I = opcode & 0x0FFF;

            this.PC += 2;
        }

        this.run[0xC] = (opcode) => { //RND Vx, byte
            if (this.DEBUG == true) {
                console.log("[+] Exec RND opcode: " + opcode.toString(16));
            }
            this.V[(opcode & 0x0F00) >> 8] = Math.floor(Math.random() * 0x100) & (opcode & 0x00FF);

            this.PC += 2;
        }

        this.run[0xD] = (opcode) => { //DRW Vx, Vy, nibble
            if (this.DEBUG == true) {
                console.log("[+] Exec DRW opcode: " + opcode.toString(16));
            }
            var x = this.V[(opcode & 0x0F00) >> 8];
            var y = this.V[(opcode & 0x00F0) >> 4];
            var n = opcode & 0x000F;

            var p;
            this.V[0xF] = 0;
            for(var i = 0; i < n; i++) {
                p = this.mem[this.I+i];
                for(var j = 0; j < 8; j++) {
                    if((p & (0x80 >> j)) != 0) {
                        if(this.vscreen[(x + j + ((y + i) * 64))] == 1)
						{
							this.V[0xF] = 1;                                    
						}
						this.vscreen[x + j + ((y + i) * 64)] ^= 1;
                    }
                }
            }

            this._draw_canvas();
            this.PC+=2;
        }

        this.run[0xF] = (opcode) => { //LD B, Vx
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
                    console.log("[!] No keyboard implemented, skiping!");
                }
                this.V[(opcode & 0x0F00) >> 8] = 0x0;

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0x1e) { //ADD I, Vx
                if (this.DEBUG == true) {
                    console.log("[+] Exec ADD opcode: " + opcode.toString(16));
                }
                this.I = (this.V[(opcode & 0x0F00) >> 8] + this.I) % 0xFFFF;

                this.PC += 2;
            } else if ((opcode & 0x00FF) == 0x29) { //LD F, Vx
                if (this.DEBUG == true) {
                    console.log("[+] Exec LD F opcode: " + opcode.toString(16));
                }
                this.I = this.V[(opcode & 0x0F00) >> 8] * 0x5

                this.PC+=2;
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
                for(var i = 0; i <= (opcode & 0x0F00) >> 8; i++) {
                    this.mem[this.I+i] = this.V[i];
                }

                this.PC+=2;
            } else if ((opcode & 0x00FF) == 0x65) { //LD Vx, [I]
                if (this.DEBUG == true) {
                    console.log("[+] Exec LD [I] opcode: " + opcode.toString(16));
                }
                for(var i = 0; i <= (opcode & 0x0F00) >> 8; i++) {
                    this.V[i] = this.mem[this.I+i];
                }

                this.PC+=2;
            } else {
                this._undef(opcode);
            }
        }
    }

    init() {
        //Load rom in memory
        var v_rom = new Uint8Array(rom);
        v_rom.forEach((e, i) => {
            this.mem[i + 0x200] = e;
        });

        //Setting PC to start of the program
        this.PC = 0x200;

        //Start interpreter
        this.start();
    }

    start() {
        //Read opcode from mem
        var opcode = this._bytes_to_numberBE(this._read_mem(this.PC));
        console.log(opcode);

        this.run[(opcode & 0xF000) >> 12](opcode);
    }

    _read_mem(pos) {
        return [this.mem[pos], this.mem[pos + 1]];
    }

    _bytes_to_numberBE(arr) {
        return (arr[0] * 0x100 + arr[1]);
    }

    //Not used!
    _bytes_to_numberLE(arr) {
        return (arr[1] * 0x100 + arr[0]);
    }

    _draw_canvas() {
        var cl = [];
        
        cl[0] = color(0);
        cl[1] = color(255);
        for(var y = 0; y < this.pix_ratio * 32; y++) { //IT WORKS! :#
            for(var x = 0; x < this.pix_ratio * 64; x++) {
                set(x, y, cl[this.vscreen[Math.floor(y/this.pix_ratio)*64 + Math.floor(x/this.pix_ratio)]]);
            }
        }

        updatePixels();
    }

    _undef(op) {
        console.log("[-] Unimplemented opcode: " + op.toString(16));
    }

    consoleDrawVScreen() {
        var str = "";
        for(var i = 0; i < 2048; i++) {
            if(i % 64 == 0) {
                str += "\n";
            }
            //Black - \e[30m
            //White - \e[97m
            if(this.vscreen[i] == 0)
                str+="O";
            else
                str+="@";
        }
        console.log(str);
    }

    view(p) {
        console.log(this.mem[(p) + 0x200].toString(16), this.mem[(p) + 1 + 0x200].toString(16));
    }
}