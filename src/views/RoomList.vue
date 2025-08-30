<template>
    <div class="room-list-container">
      <div class="header">
        <h2>面试房间列表</h2>
        <el-button type="primary" @click="createRoomDialogVisible = true">
          <el-icon><plus /></el-icon>
          创建房间
        </el-button>
      </div>
  
      <el-row :gutter="20">
        <el-col :span="8" v-for="room in rooms" :key="room.id" class="room-item">
          <el-card>
            <template #header>
              <div class="room-header">
                <h3>{{ room.topic }}</h3>
                <el-tag :type="getStatusType(room.status)">
                  {{ room.status }}
                </el-tag>
              </div>
            </template>
            
            <div class="room-content">
              <p class="description">{{ room.description }}</p>
              <div class="room-meta">
                <span>人数: {{ room.currentParticipants }}/{{ room.maxParticipants }}</span>
                <span>创建时间: {{ formatTime(room.createdAt) }}</span>
              </div>
            </div>
  
            <div class="room-actions">
              <el-button
                type="primary"
                size="small"
                @click="handleJoinRoom(room)"
                :disabled="room.status !== 'WAITING' || room.currentParticipants >= room.maxParticipants"
              >
                加入房间
              </el-button>
              <el-button size="small" @click="viewRoomDetail(room)">
                查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
  
      <el-empty v-if="rooms.length === 0" description="暂无可用房间" />
  
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
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useRoomStore } from '@/stores/room'
  import { ElMessage } from 'element-plus'
  import RoomCard from '@/components/room/RoomCard.vue'

  export default {
    components: { RoomCard },
    name: 'RoomListPage',
    setup() {
      const router = useRouter()
      const roomStore = useRoomStore()
      const rooms = ref([])
      const loading = ref(false)
      const createRoomDialogVisible = ref(false)
      const creating = ref(false)
      const roomFormRef = ref(null)
  
      const roomForm = ref({
        topic: '',
        description: '',
        maxParticipants: 6
      })
  
      const roomRules = {
        topic: [{ required: true, message: '请输入讨论话题', trigger: 'blur' }]
      }
  
      onMounted(() => {
        fetchRooms()
      })
  
      const fetchRooms = async () => {
        try {
          loading.value = true
          await roomStore.fetchRooms()
          rooms.value = roomStore.rooms
        } catch (error) {
          ElMessage.error('获取房间列表失败')
        } finally {
          loading.value = false
        }
      }
  
      const getStatusType = (status) => {
        const types = {
          WAITING: 'success',
          ONGOING: 'warning',
          COMPLETED: 'info'
        }
        return types[status] || 'info'
      }
  
      const formatTime = (time) => {
        return new Date(time).toLocaleString()
      }
  
      const handleJoinRoom = async (room) => {
        try {
          await roomStore.joinRoom(room.id)
          ElMessage.success('加入房间成功')
          router.push(`/room/${room.id}`)
        } catch (error) {
          ElMessage.error(error.response?.data?.message || '加入房间失败')
        }
      }
  
      const viewRoomDetail = (room) => {
        // 可以跳转到房间详情页面或显示详情对话框
        ElMessage.info('房间详情功能开发中')
      }
  
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
        rooms,
        loading,
        createRoomDialogVisible,
        creating,
        roomForm,
        roomRules,
        roomFormRef,
        getStatusType,
        formatTime,
        handleJoinRoom,
        viewRoomDetail,
        handleCreateRoom
      }
    }
  }
  </script>
  
  <style scoped>
  .room-list-container {
    padding: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .room-item {
    margin-bottom: 20px;
  }
  
  .room-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .room-header h3 {
    margin: 0;
    font-size: 16px;
  }
  
  .room-content {
    margin-bottom: 15px;
  }
  
  .description {
    color: #666;
    margin-bottom: 10px;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .room-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #999;
  }
  
  .room-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  </style>