#include std-header

void main() {
  vec3 c, d;
  vec2 uv = gl_FragCoord.xy / size;
  vec2 cv = uv * 2. - 1.;
  vec3 hex;
  hex = cart2hex(cv);

  float s = amax(tsin(hex / 2. - time));

  c += floor(s * 8.) / 8.;
  fragColor = vec4(c, 1);
}
