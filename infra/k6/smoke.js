import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

const baseUrl = __ENV.API_BASE_URL || 'http://localhost:5000';

export default function () {
  const res = http.get(`${baseUrl}/health`);
  check(res, { 'health is 200': (r) => r.status === 200 });
  sleep(1);
}

