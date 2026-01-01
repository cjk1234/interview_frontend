import { Client } from '@stomp/stompjs'; // 导入 Client 类
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.roomId = null;
    this.resolveConnect = null;
    this.rejectConnect = null;
  }

  connect(roomId) {
    this.roomId = roomId;
    
    // 1. 创建 STOMP 客户端
    this.stompClient = new Client({
      // 2. 使用 webSocketFactory 提供 SockJS 实例
      webSocketFactory: () => new SockJS('/api/ws'),
      
      // 3. 连接回调
      onConnect: (frame) => {
        this.joinRoom(roomId);
        if (this.resolveConnect) {
          this.resolveConnect(this.stompClient);
        }
      },
      
      // 4. 错误回调
      onStompError: (frame) => {
        console.error('STOMP 协议错误：', frame);
        if (this.rejectConnect) {
          this.rejectConnect(frame);
        }
      },
      
      // 5. WebSocket 错误回调
      onWebSocketError: (error) => {
        console.error('WebSocket 连接错误：', error);
        if (this.rejectConnect) {
          this.rejectConnect(error);
        }
      },
      
      // 6. 配置选项
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      debug: (str) => {
        // console.log('STOMP:', str);
      }
    });

    // 7. 返回 Promise
    return new Promise((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
      // 8. 激活连接
      this.stompClient.activate();
    });
  }

  // 其他方法保持不变...
  isConnected() {
    return this.stompClient && this.stompClient.connected;
  }

  joinRoom(roomId) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/join',
        body: JSON.stringify({ roomId: roomId })
      });
      console.log(`已发送加入房间请求: ${roomId}`);
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
        // console.log('Received userJoin message:', response);
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
        // console.log('Received userLeave message:', response);
        try {
          const data = JSON.parse(response.body);
          callback(data);
          // console.log('Parsed userLeave data:', data);
        } catch (e) {
          console.error('解析用户离开消息失败:', e);
        }
      });
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