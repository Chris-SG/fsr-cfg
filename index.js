var $ltMAx$reactjsxruntime = require("react/jsx-runtime");
var $ltMAx$react = require("react");
require("react-dom");
var $ltMAx$reactdomclient = require("react-dom/client");







const $a3883516d6c894dc$export$a42d5085b320e55c = ()=>"serial" in navigator;
const $a3883516d6c894dc$export$fff32d6abfbce771 = async ()=>{
    if (!$a3883516d6c894dc$export$a42d5085b320e55c()) return;
    const filters = [
        {
            usbVendorId: 0x2341,
            usbDeviceId: 0x8037
        }
    ];
    const port = await navigator.serial.requestPort({
        filters: filters
    });
    await port.open({
        baudRate: 115200
    });
    await port.setSignals({
        requestToSend: false
    });
    return port;
};
const $a3883516d6c894dc$export$89041f4a19a6c586 = async (port)=>{
    console.log("Checking readability state");
    if (!port.readable || port.readable.locked) return undefined;
    console.log("Creating reader");
    const reader = port.readable.getReader();
    console.log("Writing command");
    if (!await $a3883516d6c894dc$var$writeToPort(port, "s")) return undefined;
    console.log("Reading from reader");
    const data = await $a3883516d6c894dc$var$readFromReader(reader);
    const dataArr = data.split(" ");
    if (dataArr.length !== 10) return undefined;
    return {
        panelCount: parseInt(dataArr[1]),
        sensorCount: parseInt(dataArr[3]),
        maxPanels: parseInt(dataArr[5]),
        maxSensors: parseInt(dataArr[7]),
        buttonLimit: parseInt(dataArr[9])
    };
};
const $a3883516d6c894dc$export$d89c07c704083e54 = async (port, panelCount, sensorCount)=>{
    return $a3883516d6c894dc$var$writeToPort(port, `n ${panelCount} ${sensorCount}`);
};
const $a3883516d6c894dc$var$writeToPort = async (port, data)=>{
    const textEncoder = new TextEncoderStream();
    const writable = port.writable;
    if (!writable || writable.locked) return false;
    textEncoder.readable.pipeTo(writable);
    const writer = textEncoder.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
    return true;
};
const $a3883516d6c894dc$var$readFromReader = async (reader)=>{
    let data = "";
    const dataEndFlag = new Uint8Array([
        4,
        3
    ]);
    while(true){
        const { value: value , done: done  } = await reader.read();
        if (value) data += new TextDecoder().decode(value);
        if (done || value.slice(-2).every((val, idx)=>val === dataEndFlag[idx])) {
            reader.releaseLock();
            break;
        }
        console.log(value.slice(-2));
    }
    return data;
};
class $a3883516d6c894dc$var$PadSerialManager {
    constructor(){
        this.textEncoderStream = new TextEncoderStream();
        this.actions = [];
    }
    isAvailable = ()=>!!this.port;
    start = async ()=>{
        if (!$a3883516d6c894dc$export$a42d5085b320e55c()) return false;
        const filters = [
            {
                usbVendorId: 0x2341,
                usbDeviceId: 0x8037
            }
        ];
        try {
            this.port = await navigator.serial.requestPort({
                filters: filters
            });
            await this.port.open({
                baudRate: 115200
            });
        } catch  {
            return false;
        }
        return this.createWriter() && this.createReader();
    };
    stop = ()=>{
        this.port?.readable?.cancel();
        this.getWriter()?.close();
    };
    do = (request, callback)=>{
        if (!this.getReader()) return false;
        this.actions.push(callback);
        this.write(request);
        // this.read();
        return true;
    };
    createWriter = ()=>{
        if (!this.port?.writable || this.port?.writable?.locked) return false;
        this.textEncoderStream.readable.pipeTo(this.port?.writable);
        this.writer = this.textEncoderStream?.writable?.getWriter();
        return true;
    };
    getWriter = ()=>this.writer;
    createReader = ()=>{
        this.reader = this.port?.readable?.getReader();
        this.startReader();
        return !!this.reader;
    };
    getReader = ()=>this.reader;
    startReader = async ()=>{
        let data = new Uint8Array([]);
        const dataEndFlag = new Uint8Array([
            4,
            3
        ]);
        while(this.port?.readable?.locked){
            const { value: value , done: done  } = await this.getReader().read();
            console.log("got some data");
            if (value) data = Uint8Array.of(...data, ...value);
            if (done || value.slice(-2).every((val, idx)=>val === dataEndFlag[idx])) {
                console.log(data);
                const action = this.actions.shift();
                action && action(new TextDecoder().decode(data));
                data = new Uint8Array([]);
            }
        }
    };
    // private read = async (): void => {``
    //     console.log("start read");
    //     if (!this.getReader()) return;
    //     let data: Uint8Array = new Uint8Array([]);
    //     const dataEndFlag = new Uint8Array([4, 3]);
    //     console.log("setup");
    //     while (true) {
    //         const { value, done } = await this.getReader()!.read();
    //         console.log("got some data");
    //         if (value) {
    //             data = Uint8Array.of(...data, ...value);
    //         }
    //         if (done || value.slice(-2).every((val, idx) => val === dataEndFlag[idx])) {
    //             console.log("done");
    //             break;
    //         }
    //     };
    //     console.log(data);
    //     const action = this.actions.shift();
    //     action && action(new TextDecoder().decode(data));
    // }
    write = async (data)=>{
        if (!this.getWriter()) return;
        return this.getWriter().write(data).then(()=>{
            console.log("done writing");
        // this.getWriter()!.releaseLock();
        // this.writer?.releaseLock();
        });
    };
}
class $a3883516d6c894dc$var$PadSerialManager2 {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    open = false;
    messages = [];
    constructor(){}
    init = async ()=>{
        if (!navigator.serial) return false;
        const filters = [
            {
                usbVendorId: 0x2341,
                usbDeviceId: 0x8037
            }
        ];
        try {
            this.port = await navigator.serial.requestPort({
                filters: filters
            });
        } catch  {
            return false;
        }
        return true;
    };
    connect = async ()=>{
        if (!this.port) return;
        try {
            await this.port.open({
                baudRate: 115200,
                bufferSize: 255,
                dataBits: 8,
                flowControl: "none",
                parity: "none",
                stopBits: 1
            });
            this.open = true;
            this.monitor();
        } catch  {}
    };
    monitor = async ()=>{
        const dataEndFlag = new Uint8Array([
            4,
            3
        ]);
        while(this.open && this.port?.readable){
            this.open = true;
            const reader = this.port.readable.getReader();
            try {
                let data = new Uint8Array([]);
                while(this.open){
                    console.log("monitoring");
                    const { value: value , done: done  } = await reader.read();
                    console.log("read");
                    if (done) {
                        this.open = false;
                        break;
                    }
                    if (value) data = Uint8Array.of(...data, ...value);
                    if (data.slice(-2).every((val, idx)=>val === dataEndFlag[idx])) {
                        const decoded = this.decoder.decode(data);
                        console.log(decoded);
                        this.messages.push(decoded);
                        data = new Uint8Array([]);
                    }
                }
                console.log("stopped monitoring");
            } catch  {
                console.log("fatal?");
            }
        }
    };
    write = async (data)=>{
        if (this.port?.writable) {
            console.log("start write");
            const writer = this.port.writable.getWriter();
            await writer.write(this.encoder.encode(data));
            writer.releaseLock();
            console.log("finish write");
        }
    };
    close = async ()=>{
        await this.port?.readable?.cancel();
        await this.port?.close();
    };
}
var $a3883516d6c894dc$export$2e2bcd8739ae039 = $a3883516d6c894dc$var$PadSerialManager2;


function $01e6b6346b49dc39$export$2e2bcd8739ae039() {
    const [loading, setLoading] = (0, $ltMAx$react.useState)(true);
    const [panelSettings, setPanelSettings] = (0, $ltMAx$react.useState)(undefined);
    const [serialManager, setSerialManager] = (0, $ltMAx$react.useState)(new (0, $a3883516d6c894dc$export$2e2bcd8739ae039)());
    (0, $ltMAx$react.useEffect)(()=>{
        if (!(0, $a3883516d6c894dc$export$a42d5085b320e55c)()) {
            setLoading(false);
            return;
        }
    // requestConnection().then(port => {
    //     setSerialPort(port);
    //     setLoading(false);
    // });
    }, []);
    const updateSettings = (data)=>{
        const dataArr = data.split(" ");
        if (dataArr.length !== 10) return;
        setPanelSettings({
            panelCount: parseInt(dataArr[1]),
            sensorCount: parseInt(dataArr[3]),
            maxPanels: parseInt(dataArr[5]),
            maxSensors: parseInt(dataArr[7]),
            buttonLimit: parseInt(dataArr[9])
        });
    };
    if (loading) return /*#__PURE__*/ (0, $ltMAx$reactjsxruntime.jsx)("button", {
        onClick: ()=>{
            serialManager.init().then(()=>{
                serialManager.connect().then((result)=>{
                    setLoading(false);
                });
            });
        },
        children: "Connect to device"
    });
    return /*#__PURE__*/ (0, $ltMAx$reactjsxruntime.jsxs)("div", {
        children: [
            /*#__PURE__*/ (0, $ltMAx$reactjsxruntime.jsx)("button", {
                onClick: ()=>console.log(serialManager.write("s")),
                children: "Log settings"
            }),
            /*#__PURE__*/ (0, $ltMAx$reactjsxruntime.jsx)("p", {
                children: `${JSON.stringify(panelSettings)}`
            }),
            /*#__PURE__*/ (0, $ltMAx$reactjsxruntime.jsx)("tbody", {
                children: [
                    ...Array(panelSettings?.panelCount)
                ].map((x, i)=>/*#__PURE__*/ (0, $ltMAx$reactjsxruntime.jsxs)("button", {
                        onClick: ()=>serialManager.write(`p ${i}`),
                        children: [
                            "panel ",
                            i
                        ]
                    }))
            })
        ]
    });
}


const $4fa36e821943b400$var$container = document.getElementById("app-root");
const $4fa36e821943b400$var$root = (0, $ltMAx$reactdomclient.createRoot)($4fa36e821943b400$var$container);
$4fa36e821943b400$var$root.render(/*#__PURE__*/ (0, $ltMAx$reactjsxruntime.jsx)((0, $01e6b6346b49dc39$export$2e2bcd8739ae039), {}));


//# sourceMappingURL=index.js.map
