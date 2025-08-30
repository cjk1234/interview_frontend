<template>
    <el-menu
      mode="horizontal"
      background-color="#409EFF"
      text-color="#fff"
      active-text-color="#ffd04b"
    >
      <el-menu-item index="1" @click="$router.push('/dashboard')">
        <el-icon><house /></el-icon>
        首页
      </el-menu-item>
      <el-menu-item index="2" @click="$router.push('/rooms')">
        <el-icon><opportunity /></el-icon>
        面试房间
      </el-menu-item>
      <el-menu-item index="3" style="float: right" @click="handleLogout">
        <el-icon><switch-button /></el-icon>
        退出登录
      </el-menu-item>
      <el-menu-item index="4" style="float: right">
        <el-icon><user /></el-icon>
        {{ userInfo?.username }}
      </el-menu-item>
    </el-menu>
  </template>
  
  <script>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { ElMessageBox } from 'element-plus'
  
  export default {
    name: 'NavBar',
    setup() {
      const router = useRouter()
      const authStore = useAuthStore()
  
      const userInfo = computed(() => authStore.userInfo)
  
      const handleLogout = async () => {
        try {
          await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
          await authStore.logout()
          router.push('/login')
        } catch (error) {
          // 用户取消退出
        }
      }
  
      return {
        userInfo,
        handleLogout
      }
    }
  }
  </script>