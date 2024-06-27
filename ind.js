const axios = require('axios');
const crypto = require('crypto');

// Функція для генерації підпису HMAC-SHA256
function generateSignature(clientId, accessSecret, timestamp, method, contentHash, signUrl, nonce) {
  const stringToSign = [method, contentHash, '', signUrl].join('\n');
  const signStr = clientId + timestamp + nonce + stringToSign;
  const sign = crypto.createHmac('sha256', accessSecret)
                     .update(signStr)
                     .digest('hex')
                     .toUpperCase();
        console.log(sign);
  return sign;
}

// Параметри автентифікації
const clientId = 'q77sgudhh3vv7ns7fu7d';
const accessSecret = '1dae0dd3a7f944bc92403beb2975cfa5';
const timestamp = Date.now();
const method = 'GET'; // метод запиту
const nonce = '';
const contentHash = crypto.createHash('sha256').update('').digest('hex'); // хеш вмісту (може бути пустим, якщо немає тіла запиту)
const signUrl = '/v1.0/token?grant_type=1'; // URL-адреса запиту

// Запит на отримання токена доступу
axios.get('https://openapi.tuyaeu.com/v1.0/token?grant_type=1', {
  params: {
    client_id: clientId,
    sign: generateSignature(clientId, accessSecret, timestamp, nonce, method, contentHash, signUrl),
    sign_method: 'HMAC-SHA256',
    t: timestamp,
    lang: 'en'
  },
  headers: {
    client_id: clientId,
    sign: generateSignature(clientId, accessSecret, timestamp, nonce, method, contentHash, signUrl),
    sign_method: 'HMAC-SHA256',
    t: timestamp,
  }
})
.then(response => {
  console.log('Response Data:', response.data);

  if (!response.data.success) {
    throw new Error(`Failed to get access token: ${response.data.msg}`);
  }

  const accessToken = response.data.result.access_token;

  // Запит на отримання статусу пристрою
  const deviceId = 'bf8d373dc9544ec090zyiu';
  const statusTimestamp = Date.now().toString();
  const statusSignUrl = `/v1.0/devices/${deviceId}`;
  const statusSign = generateSignature(clientId, accessSecret, statusTimestamp, 'GET', contentHash, statusSignUrl);

  return axios.get(`https://openapi.tuyaeu.com/v1.0/devices/${deviceId}`, {
    params: {
      client_id: clientId,
      access_token: accessToken,
      sign: statusSign,
      sign_method: 'HMAC-SHA256',
      t: statusTimestamp,
      lang: 'en'
    },
    headers: {
      sign: statusSign,
      sign_method: 'HMAC-SHA256',
      t: statusTimestamp,
    }
  });
})
.then(response => {
  console.log('Device Data:', response.data.result);

  const deviceData = response.data.result;

  // Обробка даних пристрою
  console.log('Device ID:', deviceData.id);
  console.log('Device Name:', deviceData.name);
  console.log('Is Online:', deviceData.is_online);
  console.log('IP Address:', deviceData.ip);
  console.log('Latitude:', deviceData.lat);
  console.log('Longitude:', deviceData.lon);
  console.log('Model:', deviceData.model);
  console.log('Product Name:', deviceData.product_name);

  // Виконайте подальшу обробку даних, якщо потрібно
})
.catch(error => {
  console.error('Error:', error.message || error);
});

