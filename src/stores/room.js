import { defineStore } from 'pinia'
import { roomApi } from '@/services/api'
import { ElMessage } from 'element-plus'

export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: [],
    currentRoom: null,
    messages: [],
    participants: []
  }),

  actions: {
    async fetchRooms() {
      try {
        const response = await roomApi.getAvailableRooms()
        this.rooms = response.data
        return response.data
      } catch (error) {
        ElMessage.error('获取房间列表失败，请稍后重试')
        throw error
      }
    },

    async createRoom(roomData) {
      try {
        const response = await roomApi.createRoom(roomData)
        this.rooms.push(response.data)
        return response.data
      } catch (error) {
        ElMessage.error('创建房间失败，请稍后重试')
        throw error
      }
    },

    async updateRoom(roomId) {
      // 获取房间详情 - 确保是响应式对象
      const responseRoom = await roomApi.getRoomDetail(roomId)
      // 使用 Object.assign 或展开运算符确保响应式
      this.currentRoom = { ...responseRoom.data }

      // 获取参与者
      const responseParticipants = await roomApi.getRoomParticipants(roomId)
      this.participants = [...responseParticipants.data]

      // 检查是否满员并开始。这里可能有问题，因为参与者可能在你获取后发生了变化，更好的做法是由服务器推送状态变化
      if (this.participants.length >= this.currentRoom.maxParticipants) {
        await roomApi.startRoom(roomId)
        this.currentRoom.status = 'ONGOING'
      } else if (this.participants.length === 0) {
        await roomApi.completeRoom(roomId)
        this.currentRoom.status = 'COMPLETED'
        this.participants = []
      }
    },

    async joinRoom(roomId) {
      // 会进入这段代码
      try {
        // 加入房间
        const response = await roomApi.joinRoom(roomId)
        await this.updateRoom(roomId)
        return response.data
      } catch (error) {
        ElMessage.error('加入房间失败，请稍后重试')
        throw error
      }
    },

    async leaveRoom(roomId) {
      try {
        await roomApi.leaveRoom(roomId)
        await this.updateRoom(roomId)
        this.messages = []
      } catch (error) {
        ElMessage.error('离开房间失败，请稍后重试')
        throw error
      }
    },

    async addParticipant(participant) {
      this.participants.push(participant)
    },

    async removeParticipant(userId) {
      this.participants = this.participants.filter(p => p.userId !== userId)
    },

    async addMessage(message) {
      this.messages.push(message)
    },

    async clearMessages() {
      this.messages = []
    }
  }
})