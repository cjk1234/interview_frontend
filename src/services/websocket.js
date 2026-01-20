import { Client } from '@stomp/stompjs'; // 导入 Client 类
// import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.roomId = null;
    this.resolveConnect = null;
    this.rejectConnect = null;
  }

  connect(roomId) {
    this.roomId = roomId;

    // const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // const brokerUrl = `${protocol}://${window.location.host}/api/ws`;
    const brokerUrl = 'ws://localhost:8080/api/ws'

    // console.log('Connecting to WebSocket broker at:', brokerUrl);

    this.stompClient = new Client({
      brokerURL: brokerUrl,
      onConnect: () => {
        this.joinRoom(roomId);
        if (this.resolveConnect) {
          this.resolveConnect(this.stompClient);
        }
      },
      onStompError: (frame) => {
        console.error('STOMP 协议错误：', frame);
        if (this.rejectConnect) {
          this.rejectConnect(frame);
        }
      },
      onWebSocketError: (error) => {
        console.error('WebSocket 连接错误：', error);
        if (this.rejectConnect) {
          this.rejectConnect(error);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
    });
    return new Promise((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
      this.stompClient.activate();
    });
  }

  joinRoom(roomId) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/join',
        body: JSON.stringify({ roomId: roomId })
      });
    } else {
      console.warn('STOMP客户端未连接，无法加入房间');
    }
  }

  sendMessage(message) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/chat/${this.roomId}`,
        body: JSON.stringify({ roomId: this.roomId, ...message })
      });
    } else {
      console.warn('STOMP客户端未连接，无法发送消息');
    }
  }

  onMessage(callback) {
    if (this.stompClient && this.stompClient.connected) {
      return this.stompClient.subscribe(`/topic/message/${this.roomId}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (e) {
          console.error('解析消息失败:', e, message.body);
        }
      });
    } else {
      console.warn('STOMP客户端未连接，无法订阅消息');
    }
  }

  onUserJoin(callback) {
    if (this.stompClient && this.stompClient.connected) {
      return this.stompClient.subscribe(`/topic/userJoin/${this.roomId}`, (response) => {
        try {
          const data = JSON.parse(response.body);
          callback(data);
        } catch (e) {
          console.error('解析用户加入消息失败:', e);
        }
      });
    }
  }

  onUserLeave(callback) {
    if (this.stompClient && this.stompClient.connected) {
      return this.stompClient.subscribe(`/topic/userLeave/${this.roomId}`, (response) => {
        try {
          const data = JSON.parse(response.body);
          callback(data);
        } catch (e) {
          console.error('解析用户离开消息失败:', e);
        }
      });
    }
  }
  onRoomStatusChange(callback) {  
    const subscription = this.stompClient.subscribe(
      `/topic/room/${this.roomId}/status`,
      (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('解析房间状态消息失败:', error)
        }
      }
    )
    // return {
    //   unsubscribe: () => {
    //     if (subscription) subscription.unsubscribe()
    //   }
    // }
  }

  onRoomListUpdate(callback) {   
    const subscription = this.stompClient.subscribe(
      '/topic/room-list/update',
      (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('解析房间列表更新消息失败:', error)
        }
      }
    )
    
    return {
      unsubscribe: () => {
        if (subscription) subscription.unsubscribe()
      }
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate().then(() => {
        console.log('WebSocket 连接已断开');
      });
      this.stompClient = null;
    }
    this.roomId = null;
    this.resolveConnect = null;
    this.rejectConnect = null;
  }
}

export const webSocketService = new WebSocketService();