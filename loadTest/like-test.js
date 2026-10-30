import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  iterations: 10,
};

const BASE_URL = 'http://localhost:3001';

const POST_ID = '19';

const USERS = [
  { email: 'user11@gmail.com', password: 'user123456UU**' },
  { email: 'user22@gmail.com', password: 'user23456UU**' },
  { email: 'user33@gmail.com', password: 'user3456UU**' },
  { email: 'user44@gmail.com', password: 'user456UU**' },
  { email: 'user55@gmail.com', password: 'user567890UU**' },
  { email: 'user6@gmail.com', password: 'prakash123456PP**' },
  { email: 'user77@gmail.com', password: 'user7890UU**' },
  { email: 'user88@gmail.com', password: 'user890UU**' },
  { email: 'user99@gmail.com', password: 'user90UU**' },
  { email: 'prakashkumr786150@gmail.com', password: 'prakash123456PP***' },
];

export function setup() {
  const requests = USERS.map((user) => ({
    method: 'POST',
    url: `${BASE_URL}/mobile/auth/login`,
    body: JSON.stringify(user),
    params: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }));

  const responses = http.batch(requests);

  const tokens = responses.map((response, index) => {
    if (response.status !== 201) {
      throw new Error(`Login failed for user ${index + 1}: ${response.status}`);
    }

    return response.json().accessToken;
  });

  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU - 1];

  const response = http.post(
    `${BASE_URL}/mobile/wallpaper/like/${POST_ID}`,
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  check(response, {
    'Like created successfully': (r) => r.status === 201,
  });

  console.log(`User ${__VU}: ${response.status} - ${response.body}`);
}
