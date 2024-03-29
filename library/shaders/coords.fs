vec4 hexbin(vec2 cv, float s) {
  float res = s / 3.;
  vec2 base, dv;
  base = cv;
  cv *= res;

  vec2 r = vec2(1., 1. / sr3);
  r = vec2(r.y, r.x);
  vec2 h = r * 0.5;
  
  vec2 a = mod(cv, r) - h;
  vec2 b = mod(cv - h, r) - h;

  float delta = length  (a) - length  (b);
  dv = delta < 0. ? a : b;

  a = mod(base, r) - h;
  b = mod(base - h, r) - h;
  vec2 coord = length(a) < length(b) ? a : b;
  coord = (cv - dv) / res;
  dv *= 3.;
  return vec4(dv, coord);
}

vec3 roundCubic(vec3 p) {
  vec3 r = round(p);
  vec3 d = abs(r - p);
  if (d.x > d.y && d.x > d.z)
    r.x = -r.y - r.z;
  else if (d.y > d.z)
    r.y = -r.x - r.z;
  else
    r.z = -r.x - r.y;
  return r;
}

vec3 interpolatedCubic(vec3 p, out vec3 v[3]) {
  vec3 q, d, r, fl, cl, alt;
  int i0, i1, i2;

  fl = floor(p);
  cl = ceil(p);
  r = round(p);
  d = abs(r - p);

  for (int i = 0; i < 3; i++)
    alt[i] = r[i] == fl[i] ? cl[i] : fl[i];

  if (d.x > d.y && d.x > d.z)
    i0 = 0;
  else if (d.y > d.z)
    i0 = 1;
  else
    i0 = 2;
  i1 = (i0 + 1) % 3;
  i2 = (i0 + 2) % 3;

  r[i0] = -r[i1] - r[i2];
  v[0] = v[1] = v[2] = r;
  v[1][i1] = alt[i1];
  v[1][i0] = -v[1][i1] - v[1][i2];
  v[2][i2] = alt[i2];
  v[2][i0] = -v[2][i1] - v[2][i2];

  for (int i = 0; i < 3; i++)
    q[i] = 1. - amax(v[i] - p);

  q = q / sum(q);

  // I don't remember how the rest of this function even works so I'm just adding this here
  if (q.y < q.z) {
    q.yz = q.zy;
    vec3 temp = v[1];
    v[1] = v[2];
    v[2] = temp;
  }
  return q;
}

vec3 extendedCubic(vec3 p, out vec3 v[12]) {
  vec3 r, v3[3], dif;
  r = interpolatedCubic(p, v3);
  // Is there no better way to do this in glsl?
  v[0] = v3[0];
  v[1] = v3[1];
  v[2] = v3[2];
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 2; j++) {
      dif = v[(i + j + 1) % 3] - v[(i + j + 2) % 3];
      v[3 + j + i * 3] = v[i] - dif;
    }
    dif = v[i] - v[(i + 1) % 3];
    v[5 + i * 3] = v[i] + dif;
  }
  return r;
}

void extendedCubic(vec3 p, out vec3 v[19]) {
  vec3 nbrs[18] = vec3[18](
    vec3(1, 0, -1),
    vec3(0, 1, -1),
    vec3(-1, 1, 0),
    vec3(-1, 0, 1),
    vec3(0, -1, 1),
    vec3(1, -1, 0),

    vec3(2, 0, -2),
    vec3(0, 2, -2),
    vec3(-2, 2, 0),
    vec3(-2, 0, 2),
    vec3(0, -2, 2),
    vec3(2, -2, 0),

    vec3(1, 1, -2),
    vec3(1, -2, 1),
    vec3(-2, 1, 1),
    vec3(-1, -1, 2),
    vec3(-1, 2, -1),
    vec3(2, -1, -1)
  );

  vec3 r;
  r = roundCubic(p);
  for (int i = 0; i < 18; i++) {
    v[i + 1] = r + nbrs[i];
  }
}

vec3 getCubic(vec3 p) {
  return p - roundCubic(p);
}

vec2 rot(vec2 p, float a) {
  float ca = cos(a);
  float sa = sin(a);
  return mat2(
    ca, sa,
    -sa, ca
  ) * p;
}

vec3 rot(vec3 p, vec3 u, float a) {
  float cosa = cos(a);
  float cosa1 = 1. - cosa;
  float sina = sin(a);
  mat3 m = mat3(
    cosa + u.x * u.x * cosa1,         u.x * u.y * cosa1 + u.z * sina,   u.z * u.x * cosa1 - u.y * sina,
    u.x * u.y * cosa1 - u.z * sina,   cosa + u.y * u.y * cosa1,         u.z * u.y * cosa1 + u.x * sina,
    u.x * u.z * cosa1 + u.y * sina,   u.y * u.z * cosa1 - u.x * sina,   cosa + u.z * u.z * cosa1
  );
  return m * p;
}

vec2 trot(vec2 p, float a) {
  return rot(p, a * tau);
}

vec3 trot(vec3 p, vec3 u, float a) {
  return rot(p, u, a * tau);
}

vec3 rotc(vec3 p) {
  p.yz = rot(p.yz, 0.9553166181245093);
  p.xy = rot(p.xy, 0.75 * pi);
  return p;
}

vec3 arotc(vec3 p) {
  p.xy = rot(p.xy, -0.75 * pi);
  p.yz = rot(p.yz, -0.9553166181245093);
  return p;
}

vec3 rotHex(vec3 p, float a) {
  return rot(p, normalize(unit.xxx), a);
}

vec3 cart2hex(vec2 c) {
  vec3 hex;
  hex.y = (c.x - c.y * 1. / sr3);
  hex.z =  c.y * 2. / sr3;
  hex.x = -hex.z - hex.y;
  return hex;
}

vec2 hex2cart(vec3 c) {
  vec2 cart = vec2(
    c.y + 0.5 * c.z,
    sr3 / 2. * c.z
  );
  return cart;
}

vec3 hex2hex(vec3 c) {
  vec2 v;
  v = vec2(
    c.y + 0.5 * c.z,
    sr3 / 2. * c.z
  );
  v = vec2(
    v.y - v.x * 1. / sr3,
    v.x * 2. / sr3
  );
  return vec3(-v.x - v.y, v.y, v.x);
}

vec2 unit2(int i) {
  vec2 n;
  n[i] = 1.;
  return n;
}

vec3 unit3(int i) {
  vec3 n;
  n[i] = 1.;
  return n;
}

vec4 unit4(int i) {
  vec4 n;
  n[i] = 1.;
  return n;
}

vec2 scaleUv(vec2 uv, float s) {
  uv = uv * 2. - 1.;
  uv *= s;
  uv = uv * 0.5 + 0.5;
  return uv;
}


float slength(vec2 u, vec2 v, vec2 p) {
  vec2 w, x, z;
  w = u - v;
  x = p - v;
  z = project(x, w);
  z = clamp(z, min(w, unit.yy), max(w, unit.yy));
  return length(z - x);
}

float rhex(vec3 hex, float r) {
  r = length(hex * sr2/2.) * r;
  return r + length(max(abs(hex) - r, 0.));
}

float rtri(vec3 hex, float r) {
  r = length(hex * sr2/2./sr3) * r;
  return r + length(max(hex - r, 0.));
}

float slength(vec3 u, vec3 v, vec3 p) {
  return slength(hex2cart(hexProject(u)), hex2cart(hexProject(v)), hex2cart(p));
}

float clength(vec2 u, vec2 v, vec2 p) {
  vec2 w, x, z;
  w = u - v;
  x = p - v;
  z = project(x, w);
  z = clamp(z, min(w, unit.yy), max(w, unit.yy));
  return amax(cart2hex(z) - cart2hex(x));
}

float clength(vec3 u, vec3 v, vec3 p) {
  return clength(hex2cart(u), hex2cart(v), hex2cart(p));
}

vec3 ptrot(vec3 u, vec3 v, float b, float a) {
  vec3 n, o, du, dv, w, p;
  o = (u + v) / 2.;
  w = mix(cross(u, v), cross(u, v-0.0001), step(1., -dot(u, v)));
  w = trot(normalize(w), normalize(v - u), b) + o;
  du = u - w;
  dv = v - w;

  n = normalize(cross(du, dv));
  p = trot(u - o, n, a);
  p += o;

  return p;
}

vec2 s2p(vec3 p) {
  return hex2cart(hexProject(p));
}