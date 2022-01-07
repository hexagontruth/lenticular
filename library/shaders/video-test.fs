#include std-header

void main() {
  vec2 uv, cv;
  vec3 hex, c;
  uv = gl_FragCoord.xy / size;
  cv = uv * 2. - 1.;

  float m, a, b;

  hex = cart2hex(cv);

  m = length(cv);
  a = tatan(cv);
  b = step(0.5, fract(a + time));
  b = mix(b, 1. - b, step(5./6., amax(hex)));

  c = hsv2rgb(vec3(floor(uv.x * 12.) / 6., 1, 1));
  c = mix(c, 1. - c, step(0., cv.y));

  c -= b;

  c = clamp(c, 0., 1.);

  fragColor = vec4(c, 1);
}
