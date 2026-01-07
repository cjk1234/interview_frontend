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
              color="red"
              @click="handleDeleteRoom(room)"
              v-if="isRoomDeletable(room)"
            >
              删除房间
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleJoinRoom(room)"
              :disabled="room.status !== 'WAITING' || room.currentParticipants >= room.maxParticipants"
            >
              加入房间
            </el-button>
            <el-button size="small" @click="showRoomDetail(room)">
              查看详情
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="rooms.length === 0" description="暂无可用房间" />

    <!-- 创建房间对话框 -->
    <el-dialog v-model="createRoomDialogVisible" title="创建面试房间">
      <el-form :model="roomForm" :rules="roomRules">
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
            :min="2"
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

    <!-- 房间详情对话框 -->
    <el-dialog 
      v-model="roomDetailVisible" 
      :title="`房间详情 - ${selectedRoom?.topic}`"
      width="500px"
    >
      <div v-if="selectedRoom" class="room-detail-content">
        <el-descriptions :column="1">
          <el-descriptions-item label="话题标题">
            {{ selectedRoom.topic }}
          </el-descriptions-item>
          <el-descriptions-item label="话题描述">
            {{ selectedRoom.description || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="房间状态">
            <el-tag :type="getStatusType(selectedRoom.status)">
              {{ getStatusText(selectedRoom.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="参与人数">
            <div class="participants-info">
              <span class="participants-count">
                {{ selectedRoom.currentParticipants }} / {{ selectedRoom.maxParticipants }}
              </span>
              <el-progress 
                :percentage="calculatePercentage(selectedRoom)" 
                :color="getProgressColor(selectedRoom)"
                :show-text="false"
              />
              <span class="participants-text">
                {{ getParticipantsText(selectedRoom) }}
              </span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDetailTime(selectedRoom.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间" v-if="selectedRoom.startedAt">
            {{ formatDetailTime(selectedRoom.startedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间" v-if="selectedRoom.endedAt">
            {{ formatDetailTime(selectedRoom.endedAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 房间状态提示 -->
        <div class="room-status-tip" :class="getStatusTipClass(selectedRoom.status)">
          <el-icon>
            <info-filled v-if="selectedRoom.status === 'WAITING'" />
            <clock v-if="selectedRoom.status === 'ONGOING'" />
            <circle-check v-if="selectedRoom.status === 'COMPLETED'" />
          </el-icon>
          <span>{{ getStatusTip(selectedRoom) }}</span>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button 
            type="primary" 
            @click="handleJoinRoom(selectedRoom)"
            :disabled="!canJoinRoom(selectedRoom)"
          >
            加入房间
          </el-button>
          <el-button @click="roomDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useAuthStore } from '@/stores/auth'
import { webSocketService } from '@/services/websocket'
import { ElMessage } from 'element-plus'
import { InfoFilled, Clock, CircleCheck } from '@element-plus/icons-vue'

export default {
  name: 'RoomListPage',
  components: {
    InfoFilled,
    Clock,
    CircleCheck
  },
  setup() {
    const router = useRouter()
    const roomStore = useRoomStore()
    const rooms = ref([])
    const loading = ref(false)
    const createRoomDialogVisible = ref(false)
    const roomDetailVisible = ref(false)
    const creating = ref(false)
    const selectedRoom = ref(null)

    const roomListSubscriptions = ref([])

    const authStore = useAuthStore()
    const userInfo = computed(() => authStore.userInfo)

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
      setupRoomListWebSocket()
    })

    onUnmounted(() => {
      roomListSubscriptions.value.forEach(sub => sub?.unsubscribe())
      roomListSubscriptions.value = []
    })

    const setupRoomListWebSocket = async () => {
      try {
        await webSocketService.connect()
        const roomUpdateSub = webSocketService.onRoomListUpdate((data) => {
          updateRoomInList(data)
        })
        if (roomUpdateSub) {
          roomListSubscriptions.value.push(roomUpdateSub)
        }
      } catch (error) {
        console.error('房间列表 WebSocket 连接失败:', error)
      }
    }

    const updateRoomInList = (updateData) => {
      const { eventType, roomId, currentParticipants, status, room } = updateData

      if (eventType === 'ROOM_CREATED' && room) {
        if (userInfo.value?.id !== room.creatorId) {
          rooms.value.unshift(room)
        }
        return
      } else if (eventType === 'ROOM_UPDATED') {
        const index = rooms.value.findIndex(r => r.id === roomId)
        if (index !== -1) {
          const updatedRoom = {
            ...rooms.value[index],
            currentParticipants,
            status
          }
          rooms.value.splice(index, 1, updatedRoom)
        }
        
        if (selectedRoom.value && selectedRoom.value.id === roomId) {
          selectedRoom.value = {
            ...selectedRoom.value,
            currentParticipants,
            status
          }
        }
      } else if (eventType === 'ROOM_DELETED') {
        console.log('Removing room with ID:', roomId)
        rooms.value = rooms.value.filter(r => r.id !== roomId)
        if (selectedRoom.value && selectedRoom.value.id === roomId) {
          roomDetailVisible.value = false
        }
      }
    }

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

    const getStatusText = (status) => {
      const texts = {
        WAITING: '等待中',
        ONGOING: '进行中',
        COMPLETED: '已结束'
      }
      return texts[status] || status
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleDateString()
    }

    const formatDetailTime = (time) => {
      if (!time) return '-'
      return new Date(time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const showRoomDetail = (room) => {
      selectedRoom.value = room
      roomDetailVisible.value = true
    }

    const calculatePercentage = (room) => {
      return Math.round((room.currentParticipants / room.maxParticipants) * 100)
    }

    const getProgressColor = (room) => {
      const percentage = calculatePercentage(room)
      if (percentage >= 90) return '#f56c6c' // 红色，接近满员
      if (percentage >= 70) return '#e6a23c' // 黄色，较多人数
      return '#67c23a' // 绿色，正常
    }

    const getParticipantsText = (room) => {
      if (room.currentParticipants === 0) {
        return '暂无参与者'
      } else if (room.currentParticipants >= room.maxParticipants) {
        return '房间已满'
      } else {
        return `还可加入 ${room.maxParticipants - room.currentParticipants} 人`
      }
    }

    const getStatusTip = (room) => {
      switch (room.status) {
        case 'WAITING':
          return '房间等待参与者加入，您可以立即加入开始讨论'
        case 'ONGOING':
          return '面试正在进行中，请勿打扰'
        case 'COMPLETED':
          return '面试已结束，无法再加入'
        default:
          return ''
      }
    }

    const getStatusTipClass = (status) => {
      return `status-tip-${status.toLowerCase()}`
    }

    const canJoinRoom = (room) => {
      return room && 
             room.status === 'WAITING' && 
             room.currentParticipants < room.maxParticipants
    }

    const handleJoinRoom = async (room) => {
      // 会进入这段代码
      if (!canJoinRoom(room)) {
        ElMessage.warning('无法加入该房间')
        return
      }
      
      try {
        const response_data = await roomStore.joinRoom(room.id)
        if (response_data.code === 'ROOM_NOT_FOUND') {
          ElMessage.error('房间不存在')
          return
        } else if (response_data.code === 'ROOM_NOT_AVAILABLE') {
          ElMessage.error('房间开始或已结束')
          return
        } else if (response_data.code === 'ROOM_FULL') {
          ElMessage.error('房间已满')
          return
        } else if (response_data.code === 'ALREADY_JOINED_IN_IT') {
          ElMessage.error('用户已在当前房间中')
          return
        } else if (response_data.code === 'ALREADY_JOINED') {
          ElMessage.error('用户已在其他房间中')
          return
        } else {
          ElMessage.success('加入房间成功')
          roomDetailVisible.value = false
          router.push(`/room/${room.id}`)
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '加入房间失败')
      }
    }

    const handleDeleteRoom = async (room) => {
      try {
        await roomStore.deleteRoom(room.id)
        ElMessage.success('房间删除成功')
        // 从本地列表中移除已删除的房间
        rooms.value = rooms.value.filter(r => r.id !== room.id)
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '删除房间失败')
      }
    }

    const isRoomDeletable = (room) => {
      if (!room || !userInfo.value) return false      
      return room.creatorId == userInfo.value.id && room.currentParticipants === 0 && room.status === 'WAITING'
    }

    const handleCreateRoom = async () => {    
      try {
        creating.value = true
        await roomStore.createRoom({
          ...roomForm.value,
          creatorId: userInfo.value?.id
        })
        ElMessage.success('房间创建成功')
        createRoomDialogVisible.value = false
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
      roomDetailVisible,
      creating,
      roomForm,
      roomRules,
      selectedRoom,
      getStatusType,
      getStatusText,
      formatTime,
      formatDetailTime,
      showRoomDetail,
      calculatePercentage,
      getProgressColor,
      getParticipantsText,
      getStatusTip,
      getStatusTipClass,
      canJoinRoom,
      handleJoinRoom,
      handleCreateRoom,
      handleDeleteRoom,
      isRoomDeletable
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

/* 房间详情样式 */
.room-detail-content {
  padding: 10px 0;
}

.participants-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participants-count {
  font-weight: bold;
  color: #409EFF;
}

.participants-text {
  font-size: 12px;
  color: #666;
}

.room-status-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-top: 16px;
  border-radius: 4px;
  font-size: 14px;
}

.status-tip-waiting {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-tip-ongoing {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.status-tip-completed {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-descriptions__body) {
  background-color: #fafafa;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
  width: 80px;
}
</style>