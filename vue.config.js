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
        onProxyReqWs: (proxyReq, req, socket) => {
          proxyReq.setHeader('Origin', 'http://localhost:8080');
          proxyReq.removeHeader('sec-websocket-extensions');
       }
      }
    }
  }
})