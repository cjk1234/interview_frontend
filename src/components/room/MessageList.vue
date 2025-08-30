// src/components/room/MessageList.vue
<template>
  <div class="message-list" ref="messageListRef">
    <div
      v-for="message in messages"
      :key="message.id"
      :class="['message-item', { 'message-item--own': isOwnMessage(message) }]"
    >
      <el-avatar
        :size="40"
        :src="message.avatarUrl || defaultAvatar"
        class="message-item__avatar"
      />
      
      <div class="message-item__content">
        <div class="message-item__header">
          <span class="message-item__username">{{ message.username }}</span>
          <span class="message-item__time">{{ formatTime(message.createdAt) }}</span>
        </div>
        
        <div class="message-item__body">
          <div class="message-item__text">
            {{ message.content }}
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="messages.length === 0" class="message-list__empty">
      <el-empty description="暂无消息" />
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick, computed } from 'vue'
import defaultAvatar from '@/assets/images/avatar-default.png'

export default {
  name: 'MessageList',
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    currentUserId: {
      type: Number,
      default: null
    }
  },
  setup(props) {
    const messageListRef = ref(null)
    const autoScroll = ref(true)

    const isOwnMessage = computed(() => (message) => {
      return message.userId === props.currentUserId
    })

    const formatTime = (time) => {
      if (!time) return ''
      return new Date(time).toLocaleTimeString()
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (messageListRef.value && autoScroll.value) {
          messageListRef.value.scrollTop = messageListRef.value.scrollHeight
        }
      })
    }

    watch(() => props.messages, scrollToBottom, { deep: true })

    const handleScroll = () => {
      if (!messageListRef.value) return
      
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.value
      autoScroll.value = scrollHeight - scrollTop - clientHeight < 50
    }

    return {
      messageListRef,
      defaultAvatar,
      isOwnMessage,
      formatTime,
      handleScroll
    }
  }
}
</script>

<style scoped lang="scss">
.message-list {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;

  &__empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;

  &--own {
    flex-direction: row-reverse;
    
    .message-item__content {
      align-items: flex-end;
    }
    
    .message-item__text {
      background: #409EFF;
      color: white;
    }
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    max-width: 70%;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__username {
    font-size: 12px;
    font-weight: 600;
    color: #666;
  }

  &__time {
    font-size: 11px;
    color: #999;
  }

  &__text {
    background: white;
    padding: 8px 12px;
    border-radius: 8px;
    word-break: break-word;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}
</style>