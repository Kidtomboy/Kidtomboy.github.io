// 🔐 Module kiểm tra chế độ Developer
// Sử dụng query param ?dev=... hoặc mật khẩu nhập từ console
// Yêu cầu file config/secrets.js để lấy mật khẩu

import { DEV_PARAM, DEV_PASSWORD } from '../../../config/secrets.js';

let _devMode = false;

// Kiểm tra query string
const urlParams = new URLSearchParams(window.location.search);
const devParam = urlParams.get(DEV_PARAM);
if (devParam === DEV_PASSWORD) {
  _devMode = true;
  console.log('✅ Chế độ Developer đã kích hoạt');
}

// Cũng có thể nhập mật khẩu qua console bằng cách gọi window.enableDev()
window.enableDev = (pwd) => {
  if (pwd === DEV_PASSWORD) {
    _devMode = true;
    console.log('✅ Chế độ Developer đã kích hoạt');
  } else {
    console.log('❌ Mật khẩu không đúng');
  }
};

export function isDevMode() {
  return _devMode;
}