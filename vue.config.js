const { defineConfig } = require('@vue/cli-service')
const fs = require('fs') // 引入 Node.js 文件系统模块

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 3000,
    host: '0.0.0.0',
    https: true,
    // 配置自定义 HTTPS 证书
    server: {
      type: 'https',
      options: {
        key: fs.readFileSync('./localhost+2-key.pem'), // 你的私钥文件路径
        cert: fs.readFileSync('./localhost+2.pem'),     // 你的证书文件路径
      },
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
        // pathRewrite: {
        //   '^/api/ws': '/ws'
        // },
        // headers: {
        //   Origin: 'http://localhost:8080', 
        //   Referer: 'http://localhost:8080/'
        // },
        onProxyReqWs: (proxyReq, req, socket) => {
          // 1. 欺骗后端跨域
          proxyReq.setHeader('Origin', 'http://localhost:8080');
          
          // 2. 【关键修复】移除压缩头
          // 告诉后端：“我不支持压缩，请发原始数据给我”
          // 这样代理服务器就不用处理复杂的压缩流，避免了 bug
          proxyReq.removeHeader('sec-websocket-extensions');
       }
      }
    }
  }
})