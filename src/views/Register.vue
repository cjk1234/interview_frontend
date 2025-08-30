<template>
    <div class="register-container">
      <el-card class="register-card">
        <h2>用户注册</h2>
        <el-form :model="form" :rules="rules" ref="registerForm">
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
            />
          </el-form-item>
          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              placeholder="邮箱"
              prefix-icon="message"
            />
          </el-form-item>
          <el-form-item prop="school">
            <el-input
              v-model="form.school"
              placeholder="学校"
              prefix-icon="school"
            />
          </el-form-item>
          <el-form-item prop="major">
            <el-input
              v-model="form.major"
              placeholder="专业"
              prefix-icon="document"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              style="width: 100%"
              :loading="loading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-link">
          <span>已有账号？</span>
          <el-link type="primary" @click="$router.push('/login')">
            立即登录
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
    name: 'RegisterPage',
    setup() {
      const router = useRouter()
      const authStore = useAuthStore()
      const registerForm = ref(null)
      const loading = ref(false)
  
      const form = ref({
        username: '',
        password: '',
        email: '',
        school: '',
        major: '',
        grade: '',
        avatarUrl: ''
      })
  
      const rules = {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度3-20个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ]
      }
  
      const handleRegister = async () => {
        if (!registerForm.value) return
        
        try {
          await registerForm.value.validate()
          loading.value = true
          
          await authStore.register(form.value)
          ElMessage.success('注册成功')
          router.push('/dashboard')
        } catch (error) {
          ElMessage.error(error.response?.data?.message || '注册失败')
        } finally {
          loading.value = false
        }
      }
  
      return {
        form,
        rules,
        loading,
        registerForm,
        handleRegister
      }
    }
  }
  </script>
  
  <style scoped>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f5f7fa;
  }
  
  .register-card {
    width: 400px;
    padding: 20px;
  }
  
  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #409EFF;
  }
  
  .login-link {
    text-align: center;
    margin-top: 20px;
  }
  </style>