export class ComputeShader {
    constructor (device, path) {
        this.device = device;
        this.path = path;
        this.workgroupSize = [8, 8, 1];

        this.pipeline = null;
        this.bindGroups = new Map();
    }

    async load() {
        const res = await fetch(this.path);
        if (!res.ok) {
            throw new Error("Failed to load shader " + path);
        }

        const code = await res.text();
        this.module = this.device.createShaderModule({code});

        this.pipeline = this.device.createComputePipeline({
            layout: "auto",
            compute: {
                module: this.module,
                entryPoint: "main",
            },
        });
    }

    createBindGroup(index, entries) {
        const layout = this.pipeline.getBindGroupLayout(index);

        const bindGroup = this.device.createBindGroup({
            layout,
            entries,
        });

        this.bindGroups.set(index, bindGroup);
    }

    dispatch(encoder, width, height) {
        const pass = encoder.beginComputePass();
        pass.setPipeline(this.pipeline);

        for (const [i, group] of this.bindGroups) {
            pass.setBindGroup(i, group);
        }

        pass.dispatchWorkgroups(
            Math.ceil(width / this.workgroupSize[0]),
            Math.ceil(height / this.workgroupSize[1]),
            Math.ceil(1 / this.workgroupSize[2]),
        );

        pass.end();
    }
}