import {ComputeShader} from "./computeShader.js";

const canvas = document.getElementById("canvas");

if (!navigator.gpu) {
    alert("WebGPU not supported, please use a supported browser such as chrome.");
    throw new Error("WebGPU not supported.");
}

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const ctx = canvas.getContext("webgpu");
const format = navigator.gpu.getPreferredCanvasFormat();

ctx.configure({
    device,
    format,
    alphaMode: "opaque",
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
});

let outputTexture = null;
let outputView = null;

const shader = new ComputeShader(device,"shaders/shader.wgsl");
await shader.load();


function resize() {
    const ratio = window.devicePixelRatio || 1;
    //const width = Math.floor(canvas.clientWidth * ratio);
    //const height = Math.floor(canvas.clientHeight * ratio);

    const width = Math.floor(window.innerWidth * ratio);
    const height = Math.floor(window.innerHeight * ratio);

    if (canvas.width == width && canvas.height == height) return;

    canvas.width = width;
    canvas.height = height;
    
    outputTexture?.destroy();

    outputTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    outputView = outputTexture.createView();

    shader.createBindGroup(0, [{binding: 0, resource: outputView}]);
}
window.addEventListener("resize", resize);

function loop() {
    const encoder = device.createCommandEncoder();

    shader.dispatch(encoder, canvas.width, canvas.height);

    encoder.copyTextureToTexture(
        {texture: outputTexture},
        {texture: ctx.getCurrentTexture()},
        [canvas.width, canvas.height],
    );

    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(loop);
}
resize();
requestAnimationFrame(loop);