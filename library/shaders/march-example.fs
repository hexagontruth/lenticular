#include std-header
#include shapes

float SURF_DIST = 1. / pow(2., 20.);
float NORMAL_DIST = 1. / pow(2., 12.);
#define MAX_MARCH_DIST 64.
#define MAX_CAMERA_DIST 32.
#define ITER 20000
#define SCALE 1.
#define COEF 0.5

#define DIM_DIST 6.

float getDist(vec4 p) {
  vec3 a = p.xyz;
  float d;
  a.xy = rot(a.xy, time * tau);
  d = cube(a, 1.);
  return d * COEF;
}

vec4 getNormal(vec4 p, float s) {
  vec3 k = vec3(1, 0, -1);
  vec3 e = k * NORMAL_DIST;

  vec4 v = (
    k.xzzy * getDist(p + e.xzzy) +
    k.zxzy * getDist(p + e.zxzy) +
    k.zzxy * getDist(p + e.zzxy) +
    k.xxxy * getDist(p + e.xxxy)
  );
  v /= COEF;
  v = length  (v) == 0. ? v : normalize(v);
  v *= s;
  return v;
}

float march(vec4 r, vec4 d, float s) {
  float m = 0.;
  vec4 p = r;
  for (int i = 0; i < ITER; i++) {
    float dist = getDist(p) * s;
    m += dist;
    p = r + d * m;
    if (abs(m) > MAX_MARCH_DIST || abs(dist) < SURF_DIST)
      break;
  }
  return m;
}

vec4 camera(vec3 hex) {
  vec4 hex4 = vec4(hex, 0);
  vec4 c = unit.xxxx;
  vec3 a = hex;
  vec3 h;

  vec4 op, od, p, n;
  float m;

  // perspective
  // op = (-vec4(1, 1, 1, 0) * 1.);
  // od = normalize(-hex4 + 1.);
  op = hex4 + unit.xxxy;
  od = normalize(-unit.xxxy);

  m = march(op, od, 1.);
  p = op + od * m;
  n = getNormal(p, 1.);

  c = n;

  c = mix(c, vec4(1.), step(10., m));

  // nan debugging
  if (isnan(sum(c))) return vec4(1, 0, 0, 1);

  return vec4(c.rgb, 1);
}

void main() {
  vec3 c, d;
  vec2 uv = gl_FragCoord.xy / size;
  vec2 cv = uv * 2. - 1.;
  vec3 hex;
  hex = cart2hex(cv);

  c = camera(hex).rgb;
  fragColor = vec4(c, 1);
}
