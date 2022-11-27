bool isNan(float n) {
  return !(n <= 0. || 0. <= n);
}

vec4 qmul(vec4 a, vec4 b) {
  return vec4(
    a.x * b.x - a.y * b.y - a.z * b.z - a.w * b.w,
    a.x * b.y + a.y * b.x + a.z * b.w - a.w * b.z,
    a.x * b.z - a.y * b.w + a.z * b.x + a.w * b.y,
    a.x * b.w + a.y * b.z - a.z * b.y + a.w * b.x
  );
}

vec4 qsqr( vec4 a )
{
    return vec4( a.x*a.x - dot(a.yzw,a.yzw), 2.0*a.x*(a.yzw) );
}

vec4 qcube( vec4 a )
{
  return a * ( 4.0*a.x*a.x - dot(a,a)*vec4(3.0,1.0,1.0,1.0) );
}

vec4 alphamul(vec4 a, vec4 b) {
  return vec4(b.a * b.rgb + a.a * a.rgb * (1. - b.a), b.a + a.a * (1. - b.a)); 
}

vec3 alphamul(vec3 a, vec3 b, float alpha) {
  return alphamul(vec4(a, 1), vec4(b, alpha)).rgb;
}

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 clog(vec2 z) {
  return vec2(
    log(length  (z)),
    atan(z.y, z.x)
  );
}

float cmod (vec2 z) {
  return length  (z);
}

vec2 cexp(vec2 z) {
  return vec2(cos(z.y), sin(z.y)) * exp(z.x);
}

vec2 cpow (vec2 z, float x) {
  float r = length  (z);
  float theta = atan(z.y, z.x) * x;
  return vec2(cos(theta), sin(theta)) * pow(r, x);
}

vec2 cpow (vec2 a, vec2 b) {
  float aarg = atan(a.y, a.x);
  float amod = length  (a);

  float theta = log(amod) * b.y + aarg * b.x;

  return vec2(
    cos(theta),
    sin(theta)
  ) * pow(amod, b.x) * exp(-aarg * b.y);
}

vec2 csqrt (vec2 z) {
  float t = sqrt(2.0 * (cmod(z) + (z.x >= 0.0 ? z.x : -z.x)));
  vec2 f = vec2(0.5 * t, abs(z.y) / t);

  if (z.x < 0.0) f.xy = f.yx;
  if (z.y < 0.0) f.y = -f.y;

  return f;
}

vec2 cdiv (vec2 a, vec2 b) {
  float e, f;
  float g = 1.0;
  float h = 1.0;

  if( abs(b.x) >= abs(b.y) ) {
    e = b.y / b.x;
    f = b.x + b.y * e;
    h = e;
  } else {
    e = b.x / b.y;
    f = b.x * e + b.y;
    g = e;
  }

  return (a * g + h * vec2(a.y, -a.x)) / f;
}

vec2 sinhcosh (float x) {
  vec2 ex = exp(vec2(x, -x));
  return 0.5 * (ex - vec2(ex.y, -ex.x));
}

vec2 catan (vec2 z) {
  float a = z.x * z.x + (1.0 - z.y) * (1.0 - z.y);
  vec2 b = clog(vec2(1.0 - z.y * z.y - z.x * z.x, -2.0 * z.x) / a);
  return 0.5 * vec2(-b.y, b.x);
}

vec2 catanh (vec2 z) {
  float oneMinus = 1.0 - z.x;
  float onePlus = 1.0 + z.x;
  float d = oneMinus * oneMinus + z.y * z.y;

  vec2 x = vec2(onePlus * oneMinus - z.y * z.y, z.y * 2.0) / d;

  vec2 result = vec2(log(length  (x)), atan(x.y, x.x)) * 0.5;

  return result;
}

vec2 casin (vec2 z) {
  vec2 a = csqrt(vec2(
    z.y * z.y - z.x * z.x + 1.0,
    -2.0 * z.x * z.y
  ));

  vec2 b = clog(vec2(
    a.x - z.y,
    a.y + z.x
  ));

  return vec2(b.y, -b.x);
}

vec2 casinh (vec2 z) {
  vec2 res = casin(vec2(z.y, -z.x));
  return vec2(-res.y, res.x);
}

vec2 cacot (vec2 z) {
  return catan(vec2(z.x, -z.y) / dot(z, z));
}

vec2 cacoth(vec2 z) {
  return catanh(vec2(z.x, -z.y) / dot(z, z));
}


vec2 csin (vec2 z) {
  return sinhcosh(z.y).yx * vec2(sin(z.x), cos(z.x));
}

vec2 csinh (vec2 z) {
  return sinhcosh(z.x) * vec2(cos(z.y), sin(z.y));
}

vec2 ccos (vec2 z) {
  return sinhcosh(z.y).yx * vec2(cos(z.x), -sin(z.x));
}

vec2 ccosh (vec2 z) {
  return sinhcosh(z.x).yx * vec2(cos(z.y), sin(z.y));
}

vec2 ctan (vec2 z) {
  vec2 e2iz = cexp(2.0 * vec2(-z.y, z.x));

  return cdiv(
    e2iz - vec2(1, 0),
    vec2(-e2iz.y, 1.0 + e2iz.x)
  );
}

vec2 ctanh (vec2 z) {
  z *= 2.0;
  vec2 sch = sinhcosh(z.x);
  return vec2(sch.x, sin(z.y)) / (sch.y + cos(z.y));
}

float amax(vec4 v) {
  return max(max(max(v.w, abs(v.x)), abs(v.y)), abs(v.z));
}

float amax(vec3 v) {
  return max(max(abs(v.x), abs(v.y)), abs(v.z));
}

float amax(vec2 v) {
  return max(abs(v.x), abs(v.y));
}

float vmax(vec3 v) {
  return max(max(v.x, v.y), v.z);
}

float amin(vec4 v) {
  v = abs(v);
  return min(min(min(v.x, v.y), v.z), v.w);
}

float amin(vec3 v) {
  v = abs(v);
  return min(min(v.x, v.y), v.z);
}

float amin(vec2 v) {
  v = abs(v);
  return min(v.x, v.y);
}

float vmin(vec3 v) {
  return min(min(v.x, v.y), v.z);
}

float osc(float n) {
  n -= 0.25;
  return sin(n * tau) * 0.5 + 0.5;
}

vec2 osc(vec2 n) {
  n -= 0.25;
  return sin(n * tau) * 0.5 + 0.5;
}
vec3 osc(vec3 n) {
  n -= 0.25;
  return sin(n * tau) * 0.5 + 0.5;
}
vec4 osc(vec4 n) {
  n -= 0.25;
  return sin(n * tau) * 0.5 + 0.5;
}

float sum(vec2 p) {
  return p.x + p.y;
}

float sum(vec3 p) {
  return p.x + p.y + p.z;
}

float sum(vec4 p) {
  return p.x + p.y + p.z + p.w;
}

float prod(vec2 p) {
  return p.x * p.y;
}

float prod(vec3 p) {
  return p.x * p.y * p.z;
}

float prod(vec4 p) {
  return p.x * p.y * p.z * p.w;
}

vec2 project(vec2 a, vec2 b) {
  return dot(a, b) / dot(b, b) * b;
}


vec3 project(vec3 a, vec3 b) {
  return dot(a, b) / dot(b, b) * b;
}

vec4 project(vec4 a, vec4 b) {
  return dot(a, b) / dot(b, b) * b;
}

vec3 hexProject(vec3 p) {
  vec3 n = project(p, unit.xxx);
  return p - n;
}

float tatan(vec2 v) {
  float a = atan(v.y, v.x);
  a += pi;
  a /= tau;
  a = fract(a - 0.25);
  a = 1. - a;
  return a;
}

vec2 pt2cart(float m, float p) {
  p = fract(p + 0.25);
  float angle = p * tau - pi;
  return vec2(cos(angle), sin(angle)) * m;
}

float tsin(float n) {
  return sin(n * tau);
}

float tcos(float n) {
  return cos(n * tau);
}

float ttan(float n) {
  return tan(n * tau);
}

vec2 tsin(vec2 n) {
  return sin(n * tau);
}

vec2 tcos(vec2 n) {
  return cos(n * tau);
}

vec2 ttan(vec2 n) {
  return tan(n * tau);
}

vec3 tsin(vec3 n) {
  return sin(n * tau);
}

vec3 tcos(vec3 n) {
  return cos(n * tau);
}

vec3 ttan(vec3 n) {
  return tan(n * tau);
}

vec4 tsin(vec4 n) {
  return sin(n * tau);
}

vec4 tcos(vec4 n) {
  return cos(n * tau);
}

vec4 ttan(vec4 n) {
  return tan(n * tau);
}

float twav(float n) {
  n = mod(n, 1.);
  return n < 0.5 ? 1. - n * 4. : -1. + (n - .5) * 4.;
}

vec2 twav(vec2 n) {
  return vec2(twav(n.x), twav(n.y));
}

vec3 twav(vec3 n) {
  return vec3(twav(n.x), twav(n.y), twav(n.z));
}

vec4 twav(vec4 n) {
  return vec4(twav(n.x), twav(n.y), twav(n.z), twav(n.w));
}

vec2 vpow(vec2 p, float n) {
  return vec2(
    pow(p.x, n),
    pow(p.y, n)
  );
}

vec3 vpow(vec3 p, float n) {
  return vec3(
    pow(p.x, n),
    pow(p.y, n),
    pow(p.z, n)
  );
}

vec4 vpow(vec4 p, float n) {
  return vec4(
    pow(p.x, n),
    pow(p.y, n),
    pow(p.z, n),
    pow(p.w, n)
  );
}

float xsum(float s, float q) {
  return s + q - 2. * s * q;
}

vec2 xsum(vec2 s, vec2 q) {
  return s + q - 2. * s * q;
}

vec3 xsum(vec3 s, vec3 q) {
  return s + q - 2. * s * q;
}


vec4 xsum(vec4 s, vec4 q) {
  return s + q - 2. * s * q;
}

int maxdim(vec3 p) {
  int idx;
  idx = p.x > p.y ? 0 : 1;
  idx = p[idx] > p.z ? idx : 2;
  return idx;
}

int mindim(vec3 p) {
  int idx;
  idx = p.x < p.y ? 0 : 1;
  idx = p[idx] < p.z ? idx : 2;
  return idx;
}

vec3 vsort(vec3 n) {
  if (n.x > n.y) n = n.yxz;
  if (n.y > n.z) n = n.xzy;
  if (n.x > n.y) n = n.yxz;
  return n;
}

float quantize(float f, float n, float ep) {
  return floor(clamp(f * n, 0., n - ep)) / n;
}

vec2 quantize(vec2 f, float n, float ep) {
  return floor(clamp(f * n, 0., n - ep)) / n;
}

vec3 quantize(vec3 f, float n, float ep) {
  return floor(clamp(f * n, 0., n - ep)) / n;
}

vec4 quantize(vec4 f, float n, float ep) {
  return floor(clamp(f * n, 0., n - ep)) / n;
}

float quantize(float f, float n) {
  return quantize(f, n, 1./16384.);
}

vec2 quantize(vec2 f, float n) {
  return quantize(f, n, 1./16384.);
}

vec3 quantize(vec3 f, float n) {
  return quantize(f, n, 1./16384.);
}

vec4 quantize(vec4 f, float n) {
  return quantize(f, n, 1./16384.);
}


float getPartial(float t, float n, float cur) {
  float epoch, part, val;
  epoch = floor(t * n);
  part = fract(t * n);
  val = step(1., epoch - cur);
  val += step(1., 1. - abs(epoch - cur)) * part;
  val = clamp(val, 0., 1.);
  return val;
}

float qw(float n, float q, float w) {
  return smoothstep(w/2. + q/2., w/2. - q/2., abs(n));
}

vec2 qw(vec2 n, float q, float w) {
  return smoothstep(w/2. + q/2., w/2. - q/2., abs(n));
}

vec2 qw(vec2 n, float q, vec2 w) {
  return smoothstep(w/2. + q/2., w/2. - q/2., abs(n));
}

float qs(float n, float q) {
  return smoothstep(-q/2., q/2., n);
}

float qwp(float n, float q, float w) {
  return qw(abs(fract(n + 0.5) - 0.5), q, w);
}

float openStep(float m, float n) {
  return 1. - step(m, -n);
}

vec2 openStep(float m, vec2 n) {
  return 1. - step(m, -n);
}

vec3 openStep(float m, vec3 n) {
  return 1. - step(m, -n);
}

vec4 openStep(float m, vec4 n) {
  return 1. - step(m, -n);
}

float istep(float m, float n) {
  return 1. - step(m, n);
}

vec2 istep(float m, vec2 n) {
  return 1. - step(m, n);
}
vec3 istep(float m, vec3 n) {
  return 1. - step(m, n);
}

vec4 istep(float m, vec4 n) {
  return 1. - step(m, n);
}


float linearStep(float a, float b, float n) {
  return clamp((n - a) / (b - a), 0., 1.);
}
