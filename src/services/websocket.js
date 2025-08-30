import { io } from 'socket.io-client'

class WebSocketService {
  constructor() {
    this.socket = null
    this.roomId = null
  }

  connect(roomId) {
    this.roomId = roomId
    this.socket = io('/', {
      path: '/ws',
      transports: ['websocket']
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket')
      this.joinRoom(roomId)
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket')
    })

    return this.socket
  }

  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join', { roomId })
    }
  }

  sendMessage(message) {
    if (this.socket) {
      this.socket.emit('chat', {
        ...message,
        roomId: this.roomId
      })
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.on('message', callback)
    }
  }

  onUserJoin(callback) {
    if (this.socket) {
      this.socket.on('user_join', callback)
    }
  }

  onUserLeave(callback) {
    if (this.socket) {
      this.socket.on('user_leave', callback)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.roomId = null
    }
  }
}

export const webSocketService = new WebSocketService()