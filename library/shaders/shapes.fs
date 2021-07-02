
float torus(vec3 p, vec2 t)
{
  vec2 q = vec2(length  (p.xy) - t.x, p.z);
  return length  (q)-t.y;
}


float octahedron(vec3 p, float s)
{
  p = abs(p);
  float m = p.x+p.y+p.z-s;
  vec3 q;
       if( 3.0*p.x < m ) q = p.xyz;
  else if( 3.0*p.y < m ) q = p.yzx;
  else if( 3.0*p.z < m ) q = p.zxy;
  else return m*0.57735027;
    
  float k = clamp(0.5*(q.z-q.y+s),0.0,s); 
  return length  (vec3(q.x,q.y-s+k,q.z-k)); 
}

float box(vec3 p, vec3 b)
{
  vec3 q = abs(p) - b;
  return length  (max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float box(vec3 p, float n) {
  return box(p, vec3(n));
}

float box(vec2 p, vec2 s) {
  return length  (abs(p) - abs(s));
}

float cube(vec3 p, float s) {
  return box(abs(p), abs(s/2.));
}

float ve(vec3 p, float s) {
  float oct = octahedron(p, s);
  float cube = box(p, vec3(1,1,1) * s * 0.5);
  // return oct;
  return max(oct, cube);
}

float tet(vec3 p, float s)
{
  return length  (max(vec4(
    (p.x + p.z) - p.y - s,
    -(p.x + p.z) - p.y - s,
    (p.x - p.z) + p.y - s,
    -(p.x - p.z) + p.y - s
  ), 0.0)) * (1. / sr3);
}

float cross(vec3 p, float r) {
  float e = 40.;
  float a = box(p, vec3(e, 1, 1) * r);
  float b = box(p, vec3(1, e, 1) * r);
  float c = box(p, vec3(1, 1, e) * r);
  return min(min(a, b), c);
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.) / k;
  return min(a, b) - pow(h, 3.) * k / 6.;
}

float prism(vec3 p, vec2 h) {
  vec3 k = vec3(-sr3/2., 0.5, sr3/3.);
  p = abs(p);
  p.xy -= 2. * min(dot(k.xy, p.xy), 0.) * k.xy;
  vec2 d = vec2(
    length  (p.xy - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.y - h.x),
    p.z - h.y
  );
  return min(max(d.x, d.y), 0.0) + length  (max(d, 0.));
}

float flexcube(vec3 p, float s, float q) {
  float of, cf;
  of = clamp((1.5 - q), 1., 1.5);
  cf = clamp(q * 2., 1., 2.);
  float oct = octahedron(p, s * of);
  float cube = box(p, vec3(0.5) * s * cf);
  // return oct;
  return max(oct, cube);
}
