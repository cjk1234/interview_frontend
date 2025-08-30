// src/components/room/RoomCard.vue
<template>
  <el-card class="room-card" :class="{ 'room-card--hover': hover }" @click="handleClick">
    <template #header>
      <div class="room-card__header">
        <h3 class="room-card__title">{{ room.topic }}</h3>
        <el-tag :type="statusType" size="small">
          {{ statusText }}
        </el-tag>
      </div>
    </template>

    <div class="room-card__content">
      <p class="room-card__description">{{ room.description || '暂无描述' }}</p>
      
      <div class="room-card__meta">
        <div class="room-card__meta-item">
          <el-icon><user /></el-icon>
          <span>{{ room.currentParticipants }}/{{ room.maxParticipants }}</span>
        </div>
        
        <div class="room-card__meta-item">
          <el-icon><clock /></el-icon>
          <span>{{ formatTime(room.createdAt) }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="room-card__footer">
        <el-button
          type="primary"
          size="small"
          :disabled="!canJoin"
          @click.stop="handleJoin"
        >
          加入房间
        </el-button>
        
        <el-button
          size="small"
          @click.stop="handleViewDetail"
        >
          查看详情
        </el-button>
      </div>
    </template>
  </el-card>
</template>

<script>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'RoomCard',
  props: {
    room: {
      type: Object,
      required: true
    },
    hover: {
      type: Boolean,
      default: true
    }
  },
  emits: ['join', 'view-detail', 'click'],
  setup(props, { emit }) {
    const statusType = computed(() => {
      const types = {
        WAITING: 'success',
        ONGOING: 'warning',
        COMPLETED: 'info'
      }
      return types[props.room.status] || 'info'
    })

    const statusText = computed(() => {
      const texts = {
        WAITING: '等待中',
        ONGOING: '进行中',
        COMPLETED: '已结束'
      }
      return texts[props.room.status] || props.room.status
    })

    const canJoin = computed(() => {
      return props.room.status === 'WAITING' && 
             props.room.currentParticipants < props.room.maxParticipants
    })

    const formatTime = (time) => {
      if (!time) return ''
      return new Date(time).toLocaleDateString()
    }

    const handleJoin = () => {
      if (!canJoin.value) {
        ElMessage.warning('无法加入该房间')
        return
      }
      emit('join', props.room)
    }

    const handleViewDetail = () => {
      emit('view-detail', props.room)
    }

    const handleClick = () => {
      emit('click', props.room)
    }

    return {
      statusType,
      statusText,
      canJoin,
      formatTime,
      handleJoin,
      handleViewDetail,
      handleClick
    }
  }
}
</script>

<style scoped lang="scss">
.room-card {
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;

  &--hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #409EFF;
    // @include text-ellipsis;
    max-width: 70%;
  }

  &__description {
    color: #666;
    margin-bottom: 12px;
    // @include multi-line-ellipsis(2);
    line-height: 1.4;
  }

  &__meta {
    display: flex;
    gap: 16px;
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #999;

    .el-icon {
      font-size: 14px;
    }
  }

  &__footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}
</style>