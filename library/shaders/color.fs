
vec4 rgb2hsv(vec4 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec4(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x, c.w);
}

vec4 hsv2rgb(vec4 c)
{
    vec4 K = vec4(1., 2. / 3., 1. / 3., 3.);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return vec4(c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y), c.w);
}

vec3 rgb2hsv(vec3 c) {
  return rgb2hsv(vec4(c, 1)).xyz;
}

vec3 hsv2rgb(vec3 c) {
  return hsv2rgb(vec4(c, 1)).xyz;
}

vec3 beigify(vec3 c) {
  c = col_b + (col_w - col_b) * c;
  return c;
}

vec3 hsvShift(vec3 c, vec3 shift) {
  c = rgb2hsv(c);
  c += shift;
  c = hsv2rgb(c);
  return c;
}

vec4 hsvShift(vec4 c, vec3 shift) {
  c = rgb2hsv(c);
  c.rgb += shift;
  c = hsv2rgb(c);
  return c;
}

vec3 hsvScale(vec3 c, vec3 scale) {
  c = rgb2hsv(c);
  c *= scale;
  c = hsv2rgb(c);
  return c;
}

vec4 hsvScale(vec4 c, vec3 scale) {
  c = rgb2hsv(c);
  c.rgb += scale;
  c = hsv2rgb(c);
  return c;
}