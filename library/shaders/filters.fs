float gaussian(vec2 v, float sd) {
  return 1./(tau * sd * sd) * exp(-(v.x * v.x + v.y * v.y) / (2. * sd * sd));
}

float gaussian(vec3 v, float sd) {
  return 1./(pow(tau, 3./2.) * sd * sd * sd) * exp(-(v.x * v.x + v.y * v.y + v.z * v.z) / (2. * sd * sd));
}

vec4 gaussianBlur(int range, float sd, vec2 uv) {
  vec4 s, n;
  float d, ds;
  int i, j;
  i = j = -range;
  while (i <= range) {
    while (j <= range) {
      vec2 v = vec2(i, j);
      d = gaussian(v, sd);
      ds += d;
      n = texture(bufferImage, uv + v / size / 2.);
      s += n * d;
      j ++;
    }
    i ++;
  }
  s /= ds;
  return s;
}

vec4 gaussianBlur(int range, float sd) {
  vec2 uv = gl_FragCoord.xy / size;
  return gaussianBlur(range, sd, uv);
}

vec4 medianFilter() {
  vec2 uv = gl_FragCoord.xy / size;
  vec4 s[5];
  s[0] = texture(bufferImage, uv);
  for (int i = 1; i < 5; i++) {
    vec2 v = unit.xy;
    v = rot(v, float(i)/4. * tau);
    vec4 t = texture(bufferImage, uv + v / size);
    for (int j = 0; j < 4; j++) {
      float tj = t[j];
      int idx = 0;
      while (idx < i) {
        if (tj < s[idx][j])
          break;
        idx ++;
      }
      int k = i;
      while (k > idx) {
        s[k][j] = s[k - 1][j];
        k --;
      }
      s[idx][j] = tj;
    }
  }
  return s[2];
}
