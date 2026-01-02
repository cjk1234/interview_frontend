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
          <template v-if="room?.status === 'COMPLETED'">
            <el-button type="info" disabled>
              <el-icon><Check /></el-icon>
              已结束
            </el-button>
          </template>
          <template v-else-if="canCompleteRoom">
            <el-button type="success" @click="handleCompleteRoom">
              结束面试
            </el-button>
          </template>
          <el-button 
            type="warning" 
            @click="toggleVideo" 
            v-if="isInRoom && room?.status !== 'COMPLETED'"
            :icon="videoEnabled ? 'VideoPlay' : 'VideoPause'"
          >
            {{ videoEnabled ? '关闭视频' : '开启视频' }}
          </el-button>
          <el-button 
            type="warning" 
            @click="toggleAudio" 
            v-if="isInRoom && room?.status !== 'COMPLETED'"
            :icon="audioEnabled ? 'Microphone' : 'MuteNotification'"
          >
            {{ audioEnabled ? '静音' : '取消静音' }}
          </el-button>
        </div>
      </div>
  
      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 视频会议区域 -->
          <el-card class="video-container" v-if="room?.status !== 'COMPLETED'">
            <template #header>
              <div class="card-header">
                <span>视频会议</span>
                <el-button style="margin-left: 1%;"
                  size="large" 
                  @click="toggleVideoLayout" 
                  :icon="videoLayout === 'grid' ? 'Menu' : 'Grid'"
                >
                  {{ videoLayout === 'grid' ? '切换到演讲者视图' : '切换到网格视图' }}
                </el-button>
              </div>
            </template>
            <div class="video-content">
              <div :class="['video-grid', `layout-${videoLayout}`]">
                <div 
                  :class="['video-item', { 'active-speaker': false }]"
                >
                  <video 
                    ref="localVideoElement"
                    autoplay 
                    playsinline
                    muted
                    :style="{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      display: (videoEnabled && localStream) ? 'block' : 'none'
                    }"
                  ></video>
                  <div class="video-placeholder" v-show="!videoEnabled || !localStream">
                    <el-avatar :size="60" :src="userInfo?.avatarUrl" />
                    <p>{{ userInfo?.username }}</p>
                    <p v-if="!isInRoom" style="color: #909399; font-size: 12px;">
                      未加入房间
                    </p>
                  </div>
                  <div class="video-controls">
                    <el-tag size="small">我</el-tag>
                    <el-icon :color="audioEnabled ? '#67C23A' : '#F56C6C'" class="audio-indicator">
                      <Microphone />
                    </el-icon>
                  </div>
                </div>
                <div 
                  v-for="participant in remoteParticipants" 
                  :key="participant.userId"
                  :class="['video-item', { 'active-speaker': participant.isSpeaking }]"
                >
                  <video 
                    :ref="el => setVideoElement(el, participant.userId)"
                    :data-user-id="participant.userId"
                    autoplay 
                    playsinline
                    muted
                    v-show="participant.hasVideo"
                  ></video>
                  <div class="video-placeholder" v-show="!participant.hasVideo">
                    <el-avatar :size="60" :src="participant.avatarUrl" />
                    <p>{{ participant.userName }}</p>
                  </div>
                  <div class="video-controls">
                    <el-tag size="small" v-if="participant.role === 'LEADER'">组长</el-tag>
                    <el-icon :color="participant.audioEnabled ? '#67C23A' : '#F56C6C'" class="audio-indicator">
                      <Microphone />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>

          </el-card>
          <!-- 聊天区域 -->
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
                ref="messageInput"
                v-model="newMessage"
                placeholder="输入消息..."
                @keyup.enter="sendMessage"
                @input="handleInputChange"
              >
                <template #append>
                  <el-button @click="sendMessage" :disabled="!newMessage.trim()">
                    发送
                  </el-button>
                </template>
              </el-input>
              <div 
                v-if="showParticipantList" 
                class="participant-list"
                @mousedown.prevent 
              >
                <div 
                  v-for="participant in filteredParticipants" 
                  :key="participant.id"
                  class="participant-item"
                  @click="selectParticipant(participant)"
                >
                  {{ participant.userName }}
                </div>
              </div>
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
                  <span class="participant-name">{{ participant.userName }}</span>
                  <el-tag size="small" v-if="participant.role === 'LEADER'">
                    组长
                  </el-tag>
                  <el-tag size="small" type="success" v-if="participant.videoEnabled">
                    视频中
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
  import { ElMessage, Check } from 'element-plus'
  import { Microphone, VideoPlay, VideoPause, MuteNotification, Menu, Grid } from '@element-plus/icons-vue'
  import { roomApi } from '@/services/api'
  
  export default {
    name: 'RoomDetailPage',
    components: {
      Microphone,
      VideoPlay,
      VideoPause,
      MuteNotification,
      Menu,
      Grid
    },
    setup() {
      const route = useRoute()
      const router = useRouter()
      const authStore = useAuthStore()
      const roomStore = useRoomStore()
      const roomId = parseInt(route.params.id)
      const newMessage = ref('')

      const showParticipantList = ref(false)
      const searchKeyword = ref('')
      const messageInput = ref(null)

      const messagesRef = ref(null)
      const isInRoom = ref(false)

      const videoEnabled = ref(false)
      const audioEnabled = ref(false)
      const videoLayout = ref('grid') // grid or speaker
      const localStream = ref(null)

      
      // 存储订阅对象，用于取消订阅
      const subscriptions = ref([])
  
      const userInfo = computed(() => authStore.userInfo)
      const room = computed(() => roomStore.currentRoom)
      const messages = computed(() => roomStore.messages)
      const participants = computed(() => roomStore.participants || [])
      const localVideoElement = ref(null)     // 本地视频元素引用

      const remoteStreams = ref(new Map()) // 存储远程用户的视频流

      onMounted(async () => {
        // 添加 beforeunload 事件监听（页面关闭/刷新）
        window.addEventListener('beforeunload', handleBeforeUnload)
        isInRoom.value = true
        await setupWebSocket()
        await roomStore.updateRoom(roomId)
        loadMessages()
      })

      const remoteParticipants = computed(() => {
        return participants.value.filter(p => p.userId !== userInfo.value?.id)
          .map(participant => {
            const hasVideo = remoteStreams.value.has(participant.userId)
            return {
              ...participant,
              hasVideo,
              audioEnabled: true // 需要根据实际音频状态调整
            }
          })
      })

      const videoElements = ref(new Map())

      const setVideoElement = (el, userId) => {
        if (el) {
          videoElements.value.set(userId, el)
        } else {
          videoElements.value.delete(userId)
        }
      }
      // 添加视频状态的参与者列表
      const participantsWithVideo = computed(() => {
        return participants.value.map(participant => {
          const hasVideo = participant.userId === userInfo.value?.id 
            ? videoEnabled.value && localStream.value
            : remoteStreams.value.has(participant.userId)
          
          return {
            ...participant,
            videoEnabled: hasVideo,
            audioEnabled: participant.userId === userInfo.value?.id ? audioEnabled.value : true,
            isSpeaking: false,
            videoTrack: hasVideo
          }
        })
      })
  
      const canStartRoom = computed(() => {
        return room.value?.status === 'WAITING' && userInfo.value?.id === room.value?.creatorId
      })
  
      const canCompleteRoom = computed(() => {
        return room.value?.status === 'ONGOING' && userInfo.value?.id === room.value?.creatorId
      })

      // 添加 beforeunload 事件监听器
      const handleBeforeUnload = () => {
        handleLeaveRoom()
        
      }

      onUnmounted(() => {
        // 移除事件监听器
        window.removeEventListener('beforeunload', handleBeforeUnload)
        // 取消所有订阅
        subscriptions.value.forEach(sub => sub?.unsubscribe())
        subscriptions.value = []
        webSocketService.disconnect()
        stopLocalStream()
      })
  
      const setupWebSocket = async () => {
        try {
          await webSocketService.connect(roomId)

          // 订阅文本消息
          const messageSub = webSocketService.onMessage((message) => {
            if (message.messageType === 'TEXT') {
              roomStore.addMessage(message)
            }
          })
          
          // 订阅用户加入
          const userJoinSub = webSocketService.onUserJoin((participant) => {
            ElMessage.info(`${participant.userName} 加入了房间`)
            roomStore.addParticipant(participant)
            roomStore.updateRoom(roomId)
          })
          
          // 订阅用户离开
          const userLeaveSub = webSocketService.onUserLeave((participant) => {
            ElMessage.info(`${participant.userName} 离开了房间`)
            roomStore.removeParticipant(participant)
            roomStore.updateRoom(roomId)
          })

          const roomStatusSub = webSocketService.onRoomStatusChange((data) => {
            if (data.roomId === roomId) {
              // 更新本地状态
              if (roomStore.currentRoom) {
                roomStore.currentRoom.status = data.status
                
                // 更新对应的时间字段
                if (data.status === 'ONGOING' && data.startedAt) {
                  roomStore.currentRoom.startedAt = data.startedAt
                } else if (data.status === 'COMPLETED' && data.endedAt) {
                  roomStore.currentRoom.endedAt = data.endedAt
                }
              }
            }
          })
          
          // 保存订阅对象（过滤掉null值）
          subscriptions.value = [messageSub, userJoinSub, userLeaveSub, roomStatusSub].filter(Boolean)
        } catch (error) {
          console.error('WebSocket 连接错误：', error)
          ElMessage.error('实时通信连接失败，请刷新页面重试')
        }
      }

      // 在 initMediaDevices 方法中，确保视频元素正确绑定
      const initMediaDevices = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          ElMessage.warning('您的浏览器不支持视频功能')
          return
        }
        
        // 停止现有流
        if (localStream.value) {
          localStream.value.getTracks().forEach(track => track.stop())
          localStream.value = null
        }
        
        await nextTick()
        
        // 重置视频元素
        if (localVideoElement.value) {
          localVideoElement.value.srcObject = null
        }
        
        try {
          // 开启视频
          localStream.value = await navigator.mediaDevices.getUserMedia({ 
            video: videoEnabled.value ? { 
              width: { ideal: 640 },
              height: { ideal: 480 }
            } : false,
            audio: audioEnabled.value
          })
          
          // 确保视频元素存在
          if (localVideoElement.value) {
            
            // 绑定视频流
            localVideoElement.value.srcObject = localStream.value
            localVideoElement.value.muted = true
            localVideoElement.value.playsInline = true
            
            videoEnabled.value = true
            ElMessage.success('摄像头已开启')
          }
          
        } catch (error) {
          console.error('无法访问摄像头:', error)
          videoEnabled.value = false
          ElMessage.error('无法访问摄像头，请检查权限设置')
        }
      }

      // 停止本地媒体流
      const stopLocalStream = () => {
        if (localStream.value) {
          localStream.value.getTracks().forEach(track => track.stop())
          localStream.value = null
        }
      }
      
      const toggleVideo = async () => {
        const newState = !videoEnabled.value
        
        // 先更新状态
        videoEnabled.value = newState
        await nextTick()
        if (newState) {
          // 开启视频
          await initMediaDevices()
        } else {
          // 关闭视频
          if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop())
            localStream.value = null
          }
          
          if (localVideoElement.value) {
            localVideoElement.value.srcObject = null
          }
          ElMessage.success('摄像头已关闭')
        }
      }
      
      const toggleAudio = async () => {
        audioEnabled.value = !audioEnabled.value
        
        if (localStream.value && localStream.value.getAudioTracks().length > 0) {
          localStream.value.getAudioTracks().forEach(track => {
            track.enabled = audioEnabled.value
          })
        }
      }
      
      // 切换视频布局
      const toggleVideoLayout = () => {
        videoLayout.value = videoLayout.value === 'grid' ? 'speaker' : 'grid'
      }
  
      const loadMessages = async () => {
        try {
          // 这里应该调用 API 加载历史消息
          // const response = await messageApi.getRoomMessages(roomId, 1, 50)
          // roomStore.setMessages(response.data)
        } catch (error) {
          ElMessage.error('加载消息失败')
        }
      }

      const filteredParticipants = computed(() => {
        return participants.value.filter(p => p.userId !== userInfo.value?.id)
      })

      // 监听输入变化
      const handleInputChange = (value) => {
        // 如果inputElement最后一个字符是@，则显示列表
        if (value.endsWith('@')) {
          showParticipantList.value = true
          searchKeyword.value = ''
          return
        }
        showParticipantList.value = false
        searchKeyword.value = ''
      }

      // 选择参与者
      const selectParticipant = (participant) => {
        newMessage.value += `${participant.userName} `
        showParticipantList.value = false
        searchKeyword.value = ''
      }

      // 修改sendMessage函数，支持发送WebRTC信令
      const sendMessage = () => {
        if (!webSocketService.stompClient?.connected) {
          ElMessage.warning('连接未就绪，请稍后重试')
          return
        }
        const message = {
          roomId: roomId,
          userId: userInfo.value.id,
          username: userInfo.value.username,
          avatarUrl: userInfo.value.avatarUrl,
          content: newMessage.value.trim(),
          messageType: 'TEXT',
          createdAt: new Date().toISOString()
        }
        webSocketService.sendMessage(message)
        newMessage.value = ''
      }
  
      const handleLeaveRoom = async () => {
        try {
          // 先取消订阅和断开连接
          subscriptions.value.forEach(sub => sub?.unsubscribe())
          webSocketService.disconnect()
          
          // 关闭媒体流
          stopLocalStream()

          await roomStore.leaveRoom(roomId)
          ElMessage.success('已离开房间')
          router.push('/rooms')
        } catch (error) {
          ElMessage.error('离开房间失败')
        }
      }
  
      const handleStartRoom = async () => {
        try {
          await roomApi.startRoom(roomId)
          ElMessage.success('面试已开始')
        } catch (error) {
          ElMessage.error('开始面试失败')
        }
      }
  
      const handleCompleteRoom = async () => {
        try {
          await roomApi.completeRoom(roomId)
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
        return new Date(time).toLocaleString()
      }
  
      return {
        room,
        messages,
        participants,
        participantsWithVideo,
        newMessage,
        messagesRef,
        videoElements,
        userInfo,
        isInRoom,
        videoEnabled,
        audioEnabled,
        videoLayout,
        canStartRoom,
        canCompleteRoom,
        remoteParticipants,
        localStream,
        localVideoElement,
        Check,
        showParticipantList,
        filteredParticipants,
        messageInput,
        sendMessage,
        handleInputChange,
        selectParticipant,
        handleLeaveRoom,
        handleStartRoom,
        handleCompleteRoom,
        toggleVideo,
        toggleAudio,
        toggleVideoLayout,
        getStatusType,
        formatTime,
        setVideoElement,
        // 图标引用
        Microphone,
        VideoPlay,
        VideoPause,
        MuteNotification,
        Menu,
        Grid
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
  
  .video-container {
    height: 60vh;
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
  }

  .video-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    min-height: 200px;
    max-height: calc(60vh - 120px);
  }

  .video-grid {
    display: grid;
    gap: 10px;
    min-height: 200px;
    /* flex: 1; */
  }
  
  .video-grid.layout-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .video-grid.layout-speaker {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(200px, 1fr);
  }
  
  .video-item {
    position: relative;
    width: 100%;
    height: 100%;
    background: #f0f2f5;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 16/9;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .video-item.active-speaker {
    box-shadow: 0 0 0 2px #67C23A;
  }
  
  .video-item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .video-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #606266;
  }
  
  .video-controls {
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: flex;
    gap: 5px;
    align-items: center;
  }
  
  .audio-indicator {
    font-size: 16px;
  }

  .chat-container {
    height: 40vh;
    display: flex;
    flex-direction: column;
  }
  
  .message-input {
    position: relative;
  }

  .participant-list {
    background: rgb(254, 254, 254);
    overflow-y: auto;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    flex-direction: column;
    display: flex;
  }

  .participant-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
  }

  .participant-item:hover {
    background-color: #f5f7fa;
  }

  .participant-item:last-child {
    border-bottom: none;
  }

  .messages {
    flex: 1;
    overflow-y: auto; /* 必须设置为auto或scroll */
    overflow-x: hidden; /* 防止水平滚动 */
    padding: 10px;
    /* min-height: 200px; */
    max-height: calc(40vh - 100px); /* 减去输入框高度 */
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    font-size: 20px;
    color: #409EFF;
  }
  </style>