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

    async joinRoom(roomId) {
      // 会进入这段代码
      try {
        const response = await roomApi.joinRoom(roomId)
        // console.log('joinRoom response', response)

        const responseRoom = await roomApi.getRoomDetail(roomId)
        this.currentRoom = responseRoom.data
        // console.log('this.currentRoom', this.currentRoom)

        const responseParticipants = await roomApi.getRoomParticipants(roomId)
        this.participants = responseParticipants.data
        // console.log('this.participants', this.participants)

        return response.data
      } catch (error) {
        ElMessage.error('加入房间失败，请稍后重试')
        throw error
      }
    },

    async leaveRoom(roomId) {
      try {
          await roomApi.leaveRoom(roomId)
          this.currentRoom = null
          this.messages = []
          this.participants = []
      } catch (error) {
          ElMessage.error('离开房间失败，请稍后重试')
          throw error
      }
    },

    addParticipant(participant) {
      this.participants.push(participant)
      console.log('Current participants:', this.participants)
    },

    removeParticipant(userId) {
      this.participants = this.participants.filter(p => p.userId !== userId)
    },

    addMessage(message) {
      this.messages.push(message)
    },

    clearMessages() {
      this.messages = []
    }
  }
})