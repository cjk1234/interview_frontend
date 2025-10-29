const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 3000,
    host: '0.0.0.0',
    https: {
      key: require('fs').readFileSync('C:/Users/chenjingkai/server.key'),
      cert: require('fs').readFileSync('C:/Users/chenjingkai/server.crt')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8443',
        changeOrigin: true,
        secure: false,
      },
      '/api/ws': {
        target: 'http://localhost:8443',
        ws: false,   // 保持 ws: true 不会影响 HTTP 降级方案的使用
        changeOrigin: true,
        secure: false,
      }
    }
  }
})