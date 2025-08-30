<template>
    <div class="login-container">
      <el-card class="login-card">
        <h2>用户登录</h2>
        <el-form :model="form" :rules="rules" ref="loginForm">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              prefix-icon="user"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              prefix-icon="lock"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              style="width: 100%"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="register-link">
          <span>没有账号？</span>
          <el-link type="primary" @click="$router.push('/register')">
            立即注册
          </el-link>
        </div>
      </el-card>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { ElMessage } from 'element-plus'
  
  export default {
    name: 'LoginPage',
    setup() {
      const router = useRouter()
      const authStore = useAuthStore()
      const loginForm = ref(null)
      const loading = ref(false)
  
      const form = ref({
        username: '',
        password: ''
      })
  
      const rules = {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
  
      const handleLogin = async () => {
        if (!loginForm.value) return
        
        try {
          await loginForm.value.validate()
          loading.value = true
          
          await authStore.login(form.value)
          ElMessage.success('登录成功')
          router.push('/dashboard')
        } catch (error) {
          ElMessage.error(error.response?.data?.message || '登录失败')
        } finally {
          loading.value = false
        }
      }
  
      return {
        form,
        rules,
        loading,
        loginForm,
        handleLogin
      }
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f5f7fa;
  }
  
  .login-card {
    width: 400px;
    padding: 20px;
  }
  
  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #409EFF;
  }
  
  .register-link {
    text-align: center;
    margin-top: 20px;
  }
  </style>