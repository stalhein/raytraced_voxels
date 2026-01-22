@group(0) @binding(0)
var outputTex : texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id : vec3<u32>) {
  let size = textureDimensions(outputTex);

  // Bounds check
  if (id.x >= size.x || id.y >= size.y) {
    return;
  }

  // Normalized coords [-1, 1], aspect-correct
  let uv = vec2<f32>(id.xy) / vec2<f32>(size);
  let aspect = f32(size.x) / f32(size.y);
  let c = vec2<f32>(
    (uv.x - 0.5) * 3.0 * aspect - 0.5,
    (uv.y - 0.5) * 3.0
  );

  // Mandelbrot iteration
  var z = vec2<f32>(0.0, 0.0);
  var i = 0;
  let maxIter = 100;

  loop {
    if (i >= maxIter || dot(z, z) > 4.0) {
      break;
    }

    z = vec2<f32>(
      z.x * z.x - z.y * z.y + c.x,
      2.0 * z.x * z.y + c.y
    );

    i++;
  }

  // Smooth coloring
  let t = f32(i) / f32(maxIter);
  let color = vec3<f32>(
    0.5 + 0.5 * cos(6.2831 * (t + 0.0)),
    0.5 + 0.5 * cos(6.2831 * (t + 0.33)),
    0.5 + 0.5 * cos(6.2831 * (t + 0.67))
  );

  textureStore(
    outputTex,
    vec2<i32>(id.xy),
    vec4<f32>(color, 1.0)
  );
}
