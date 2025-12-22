// 清除前端缓存的脚本
// 这个脚本需要在浏览器控制台中运行

console.log('🧹 开始清除前端缓存...');

// 清除 localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`清除 localStorage: ${key}`);
  localStorage.removeItem(key);
});

// 清除 sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  console.log(`清除 sessionStorage: ${key}`);
  sessionStorage.removeItem(key);
});

console.log('✅ 前端缓存清除完成！');
console.log('🔄 请刷新页面以查看最新数据');

// 自动刷新页面
setTimeout(() => {
  window.location.reload();
}, 1000);