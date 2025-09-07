const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/api/ws': {
        target: 'http://localhost:8080',
        ws: false,   // 保持 ws: true 不会影响 HTTP 降级方案的使用
        changeOrigin: true
      }
    }
  }
})