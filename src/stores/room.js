import { defineStore } from 'pinia'
import { roomApi } from '@/services/api'

export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: [],
    currentRoom: null,
    messages: [],
    participants: []
  }),

  actions: {
    async fetchRooms() {
      const response = await roomApi.getAvailableRooms()
      this.rooms = response.data
    },

    async createRoom(roomData) {
      const response = await roomApi.createRoom(roomData)
      this.rooms.push(response.data)
      return response.data
    },

    async joinRoom(roomId) {
      const response = await roomApi.joinRoom(roomId)
      this.currentRoom = response.data
      return response.data
    },

    async leaveRoom(roomId) {
      await roomApi.leaveRoom(roomId)
      this.currentRoom = null
      this.messages = []
      this.participants = []
    },

    addMessage(message) {
      this.messages.push(message)
    },

    clearMessages() {
      this.messages = []
    }
  }
})