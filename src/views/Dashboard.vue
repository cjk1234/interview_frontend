<template>
    <div class="dashboard-container">
      <el-row :gutter="20">
        <el-col :span="8">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-icon size="32" class="is-loading"><loading /></el-icon>
          <span>加载中...</span>
        </div>
        <!-- 用户信息卡片 -->
          <el-card class="user-card" v-if="userInfo">
            <div class="user-info">
              <el-avatar :size="80" :src="userInfo.avatarUrl || defaultAvatar"/>
              <div class="user-details">
                <h3>{{ userInfo.username }}</h3>
                <p>{{ userInfo.school || '未设置学校' }} - {{ userInfo.major || '未设置专业' }}</p>
                <p>等级: {{ userInfo.grade || '未设置' }}</p>
              </div>
            </div>
          </el-card>
  
          <!-- 用户信息为空的情况 -->
          <el-card class="user-card" v-else>
            <div class="user-info">
              <el-avatar :size="80" :src="defaultAvatar" />
              <div class="user-details">
                <h3>用户信息加载失败</h3>
                <p>请刷新页面或重新登录</p>
              </div>
            </div>
          </el-card>

          <el-card class="quick-actions">
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
              </div>
            </template>
            <el-button type="primary" @click="$router.push('/rooms')" style="width: 100%; margin-bottom: 10px;">
              <el-icon><opportunity /></el-icon>
              加入面试房间
            </el-button>
            <el-button @click="createRoomDialogVisible = true" style="width: 100%">
              <el-icon><plus /></el-icon>
              创建新房间
            </el-button>
          </el-card>
        </el-col>
  
        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最近活动</span>
              </div>
            </template>
            <el-empty description="暂无最近活动" v-if="false" />
            <div v-else>
              <!-- 最近活动列表 -->
            </div>
          </el-card>
        </el-col>
      </el-row>
  
      <!-- 创建房间对话框 -->
      <el-dialog v-model="createRoomDialogVisible" title="创建面试房间">
        <el-form :model="roomForm" :rules="roomRules" ref="roomFormRef">
          <el-form-item label="讨论话题" prop="topic">
            <el-input v-model="roomForm.topic" placeholder="请输入讨论话题" />
          </el-form-item>
          <el-form-item label="话题描述" prop="description">
            <el-input
              v-model="roomForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入话题详细描述"
            />
          </el-form-item>
          <el-form-item label="最大人数" prop="maxParticipants">
            <el-input-number
              v-model="roomForm.maxParticipants"
              :min="3"
              :max="10"
              placeholder="请输入最大参与人数"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="createRoomDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateRoom" :loading="creating">
            创建
          </el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useRoomStore } from '@/stores/room'
  import { ElMessage } from 'element-plus'
  import defaultAvatar from '@/assets/images/avatar-default.png' // 导入默认头像
  
  export default {
    name: 'DashboardPage',
    setup() {
      const router = useRouter()
      const authStore = useAuthStore()
      const roomStore = useRoomStore()
      const createRoomDialogVisible = ref(false)
      const creating = ref(false)
      const roomFormRef = ref(null)
      const loading = ref(false)
  
      const userInfo = computed(() => authStore.userInfo)
  
      const roomForm = ref({
        topic: '',
        description: '',
        maxParticipants: 6
      })
  
      const roomRules = {
        topic: [{ required: true, message: '请输入讨论话题', trigger: 'blur' }],
        maxParticipants: [{ required: true, message: '请选择最大人数', trigger: 'blur' }]
      }
  
      onMounted(async () => {
      // 如果用户信息为空，则从服务器获取
      if (!authStore.userInfo) {
        loading.value = true
        try {
          await authStore.fetchUserInfo()
        } catch (error) {
          ElMessage.error('获取用户信息失败')
        } finally {
          loading.value = false
        }
      }
    })
  
      const handleCreateRoom = async () => {
        if (!roomFormRef.value) return
        
        try {
          await roomFormRef.value.validate()
          creating.value = true
          
          const room = await roomStore.createRoom(roomForm.value)
          ElMessage.success('房间创建成功')
          createRoomDialogVisible.value = false
          router.push(`/room/${room.id}`)
        } catch (error) {
          ElMessage.error(error.response?.data?.message || '创建房间失败')
        } finally {
          creating.value = false
        }
      }
  
      return {
        userInfo,
        createRoomDialogVisible,
        creating,
        roomForm,
        roomRules,
        roomFormRef,
        loading,
        defaultAvatar,
        handleCreateRoom
      }
    }
  }
  </script>
  
  <style scoped>
  .dashboard-container {
    padding: 20px;
  }
  
  .user-card {
    margin-bottom: 20px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .user-details h3 {
    margin: 0 0 10px 0;
    color: #409EFF;
  }
  
  .user-details p {
    margin: 5px 0;
    color: #666;
  }
  
  .quick-actions {
    margin-bottom: 20px;
  }
  
  .card-header {
    font-weight: bold;
    color: #409EFF;
  }
  </style>