<template>
    <div class="room-detail-container">
      <div class="room-header">
        <h2>{{ room?.topic }}</h2>
        <div class="room-actions">
          <el-tag :type="getStatusType(room?.status)">
            {{ room?.status }}
          </el-tag>
          <el-button @click="handleLeaveRoom" v-if="isInRoom">
            离开房间
          </el-button>
          <el-button type="primary" @click="handleStartRoom" v-if="canStartRoom">
            开始面试
          </el-button>
          <el-button type="success" @click="handleCompleteRoom" v-if="canCompleteRoom">
            结束面试
          </el-button>
        </div>
      </div>
  
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="chat-container">
            <div class="messages" ref="messagesRef">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="['message', { 'own-message': message.userId === userInfo?.id }]"
              >
                <el-avatar :size="40" :src="message.avatarUrl" />
                <div class="message-content">
                  <div class="message-header">
                    <span class="username">{{ message.username }}</span>
                    <span class="time">{{ formatTime(message.createdAt) }}</span>
                  </div>
                  <div class="message-body">
                    {{ message.content }}
                  </div>
                </div>
              </div>
            </div>
  
            <div class="message-input">
              <el-input
                v-model="newMessage"
                placeholder="输入消息..."
                @keyup.enter="sendMessage"
              >
                <template #append>
                  <el-button @click="sendMessage" :disabled="!newMessage.trim()">
                    发送
                  </el-button>
                </template>
              </el-input>
            </div>
          </el-card>
        </el-col>
  
        <el-col :span="8">
          <el-card class="participants-container">
            <template #header>
              <div class="card-header">
                <span>参与者 ({{ participants.length }}/{{ room?.maxParticipants }})</span>
              </div>
            </template>
            <div class="participants-list">
              <div
                v-for="participant in participants"
                :key="participant.userId"
                class="participant"
              >
                <el-avatar :size="40" :src="participant.avatarUrl" />
                <div class="participant-info">
                  <span class="participant-name">{{ participant.username }}</span>
                  <el-tag size="small" v-if="participant.role === 'LEADER'">
                    组长
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
  
          <el-card class="room-info">
            <template #header>
              <div class="card-header">
                <span>房间信息</span>
              </div>
            </template>
            <div class="info-item">
              <label>话题描述:</label>
              <span>{{ room?.description }}</span>
            </div>
            <div class="info-item">
              <label>创建时间:</label>
              <span>{{ formatTime(room?.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>开始时间:</label>
              <span>{{ room?.startedAt ? formatTime(room.startedAt) : '未开始' }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useRoomStore } from '@/stores/room'
  import { webSocketService } from '@/services/websocket'
  import { ElMessage } from 'element-plus'
  
  export default {
    name: 'RoomDetailPage',
    setup() {
      const route = useRoute()
      const router = useRouter()
      const authStore = useAuthStore()
      const roomStore = useRoomStore()
      const roomId = parseInt(route.params.id)
      const newMessage = ref('')
      const messagesRef = ref(null)
      const isInRoom = ref(false)
  
      const userInfo = computed(() => authStore.userInfo)
      const room = computed(() => roomStore.currentRoom)
      const messages = computed(() => roomStore.messages)
      const participants = ref([])
  
      const canStartRoom = computed(() => {
        return room.value?.status === 'WAITING' && userInfo.value?.id === 1 // 假设用户1有权限
      })
  
      const canCompleteRoom = computed(() => {
        return room.value?.status === 'ONGOING' && userInfo.value?.id === 1
      })
  
      onMounted(async () => {
        await joinRoom()
        setupWebSocket()
        loadMessages()
      })
  
      onUnmounted(() => {
        webSocketService.disconnect()
      })
  
      const joinRoom = async () => {
        try {
          await roomStore.joinRoom(roomId)
          isInRoom.value = true
          // 这里应该加载参与者列表
          participants.value = [
            { userId: 1, username: '用户1', avatarUrl: '', role: 'LEADER' },
            { userId: 2, username: '用户2', avatarUrl: '', role: 'MEMBER' }
          ]
        } catch (error) {
          ElMessage.error('加入房间失败')
          router.push('/rooms')
        }
      }
  
      const setupWebSocket = () => {
        const socket = webSocketService.connect(roomId)
        
        socket.on('message', (message) => {
          roomStore.addMessage(message)
          scrollToBottom()
        })
  
        socket.on('user_join', (user) => {
          ElMessage.info(`${user.username} 加入了房间`)
          // 更新参与者列表
        })
  
        socket.on('user_leave', (user) => {
          ElMessage.info(`${user.username} 离开了房间`)
          // 更新参与者列表
        })
      }
  
      const loadMessages = async () => {
        try {
          // 加载历史消息
          // const response = await messageApi.getRoomMessages(roomId, 1, 50)
          // roomStore.messages = response.data
          scrollToBottom()
        } catch (error) {
          ElMessage.error('加载消息失败')
        }
      }
  
      const sendMessage = () => {
        if (!newMessage.value.trim()) return
  
        const message = {
          userId: userInfo.value.id,
          content: newMessage.value.trim(),
          messageType: 'TEXT'
        }
  
        webSocketService.sendMessage(message)
        newMessage.value = ''
      }
  
      const scrollToBottom = () => {
        nextTick(() => {
          if (messagesRef.value) {
            messagesRef.value.scrollTop = messagesRef.value.scrollHeight
          }
        })
      }
  
      const handleLeaveRoom = async () => {
        try {
          await roomStore.leaveRoom(roomId)
          ElMessage.success('已离开房间')
          router.push('/rooms')
        } catch (error) {
          ElMessage.error('离开房间失败')
        }
      }
  
      const handleStartRoom = async () => {
        try {
          await roomStore.startRoom(roomId)
          ElMessage.success('面试已开始')
        } catch (error) {
          ElMessage.error('开始面试失败')
        }
      }
  
      const handleCompleteRoom = async () => {
        try {
          await roomStore.completeRoom(roomId)
          ElMessage.success('面试已结束')
        } catch (error) {
          ElMessage.error('结束面试失败')
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
        if (!time) return ''
        return new Date(time).toLocaleTimeString()
      }
  
      return {
        room,
        messages,
        participants,
        newMessage,
        messagesRef,
        userInfo,
        isInRoom,
        canStartRoom,
        canCompleteRoom,
        sendMessage,
        handleLeaveRoom,
        handleStartRoom,
        handleCompleteRoom,
        getStatusType,
        formatTime
      }
    }
  }
  </script>
  
  <style scoped>
  .room-detail-container {
    padding: 20px;
  }
  
  .room-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .room-header h2 {
    margin: 0;
    color: #409EFF;
  }
  
  .chat-container {
    height: 70vh;
    display: flex;
    flex-direction: column;
  }
  
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }
  
  .message {
    display: flex;
    margin-bottom: 15px;
    gap: 10px;
  }
  
  .message.own-message {
    flex-direction: row-reverse;
  }
  
  .message.own-message .message-content {
    align-items: flex-end;
  }
  
  .message-content {
    display: flex;
    flex-direction: column;
    max-width: 60%;
  }
  
  .message-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
  }
  
  .username {
    font-weight: bold;
    font-size: 12px;
  }
  
  .time {
    font-size: 10px;
    color: #999;
  }
  
  .message-body {
    background: #f5f7fa;
    padding: 10px;
    border-radius: 8px;
    word-break: break-word;
  }
  
  .message.own-message .message-body {
    background: #409EFF;
    color: white;
  }
  
  .message-input {
    padding: 10px;
    border-top: 1px solid #eee;
  }
  
  .participants-container {
    margin-bottom: 20px;
  }
  
  .participants-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .participant {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }
  
  .participant:last-child {
    border-bottom: none;
  }
  
  .participant-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .participant-name {
    font-weight: bold;
  }
  
  .room-info {
    margin-bottom: 20px;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  
  .info-item label {
    font-weight: bold;
    color: #666;
  }
  
  .info-item span {
    text-align: right;
    color: #333;
  }
  
  .card-header {
    font-weight: bold;
    color: #409EFF;
  }
  </style>