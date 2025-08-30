// src/components/room/ParticipantList.vue
<template>
  <div class="participant-list">
    <div class="participant-list__header">
      <h3>参与者 ({{ participants.length }})</h3>
      <el-button
        v-if="showRefresh"
        size="small"
        :icon="Refresh"
        @click="$emit('refresh')"
      >
        刷新
      </el-button>
    </div>

    <div class="participant-list__content">
      <div
        v-for="participant in participants"
        :key="participant.userId"
        :class="['participant-item', { 'participant-item--leader': participant.role === 'LEADER' }]"
      >
        <el-avatar
          :size="40"
          :src="participant.avatarUrl || defaultAvatar"
          class="participant-item__avatar"
        />
        
        <div class="participant-item__info">
          <div class="participant-item__name">
            {{ participant.username }}
            <el-tag
              v-if="participant.role === 'LEADER'"
              size="mini"
              type="warning"
            >
              组长
            </el-tag>
          </div>
          
          <div class="participant-item__status">
            <el-tag
              v-if="participant.userId === currentUserId"
              size="mini"
              type="success"
            >
              我
            </el-tag>
            <span class="participant-item__time">
              加入时间: {{ formatTime(participant.joinedAt) }}
            </span>
          </div>
        </div>

        <div class="participant-item__actions" v-if="showActions">
          <el-button
            v-if="currentUserRole === 'LEADER' && participant.role !== 'LEADER'"
            size="mini"
            @click="$emit('transfer-leadership', participant)"
          >
            设为组长
          </el-button>
        </div>
      </div>

      <div v-if="participants.length === 0" class="participant-list__empty">
        <el-empty description="暂无参与者" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import defaultAvatar from '@/assets/images/avatar-default.png'

export default {
  name: 'ParticipantList',
  props: {
    participants: {
      type: Array,
      default: () => []
    },
    currentUserId: {
      type: Number,
      default: null
    },
    currentUserRole: {
      type: String,
      default: 'MEMBER'
    },
    showActions: {
      type: Boolean,
      default: false
    },
    showRefresh: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh', 'transfer-leadership'],
  setup() {
    const formatTime = (time) => {
      if (!time) return ''
      return new Date(time).toLocaleTimeString()
    }

    return {
      Refresh,
      defaultAvatar,
      formatTime
    }
  }
}
</script>

<style scoped lang="scss">
.participant-list {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;

    h3 {
      margin: 0;
      color: #409EFF;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  &__empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f5f7fa;
  }

  &--leader {
    background-color: #fff8e6;
    border: 1px solid #ffd666;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    margin-bottom: 4px;
    // @include text-ellipsis;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__time {
    font-size: 12px;
    color: #999;
  }

  &__actions {
    flex-shrink: 0;
  }
}
</style>