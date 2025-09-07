import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs'; // 主要使用 Stomp 对象

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.roomId = null;
  }

  connect(roomId) {
    this.roomId = roomId;
    // 1. 创建 SockJS 连接 (使用 HTTP 协议)
    const socket = new SockJS('/ws');

    // 2. 使用 Stomp.over 方法创建 STOMP 客户端
    this.stompClient = Stomp.over(socket);

    // 3. 禁用心跳（避免与SockJS冲突，简化调试）
    this.stompClient.heartbeat.outgoing = 0;
    this.stompClient.heartbeat.incoming = 0;

    // 4. 禁用调试日志（避免控制台输出过多信息）
    this.stompClient.debug = () => {};

    // 5. 返回一个 Promise，连接成功则resolve，失败则reject
    return new Promise((resolve, reject) => {
      this.stompClient.connect(
        {}, // 连接头，通常为空对象
        (frame) => { // 成功回调，frame是连接帧信息
          console.log('STOMP 连接成功', frame);
          this.joinRoom(roomId); // 连接成功后立即加入房间
          resolve(this.stompClient); // 将连接成功的客户端传出
        },
        (error) => { // 失败回调
          console.error('STOMP 连接失败：', error);
          reject(error);
        }
      );
    });
  }

  joinRoom(roomId) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(
        '/app/join', // 目标地址，对应后端 @MessageMapping("/join")
        {}, //  headers头信息（无则必须传空对象{}，不能省略或传null）
        JSON.stringify({ roomId: roomId }) // 消息体必须是字符串
      );
      console.log(`已发送加入房间请求: ${roomId}`);
    } else {
      console.warn('STOMP客户端未连接，无法加入房间');
    }
  }

  sendMessage(message) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(
        '/app/chat',
        {},
        JSON.stringify({ ...message, roomId: this.roomId })
      );
    } else {
      console.warn('STOMP客户端未连接，无法发送消息');
    }
  }

  onMessage(callback) {
    if (this.stompClient && this.stompClient.connected) {
      return this.stompClient.subscribe(`/topic/message/${this.roomId}`, (response) => {
        try {
          const message = JSON.parse(response.body);
          callback(message);
        } catch (e) {
          console.error('解析消息失败:', e, response.body);
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

  disconnect() {
    if (this.stompClient) {
      if (this.stompClient.connected) {
        this.stompClient.disconnect();
        console.log('WebSocket 连接已断开');
      }
      this.stompClient = null;
    }
    this.roomId = null;
  }
}

// 导出单例实例
export const webSocketService = new WebSocketService();