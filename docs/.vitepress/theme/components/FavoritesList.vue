<template>
  <div class="favorites-wrapper">
    <div v-if="items.length === 0" class="empty-billboard">
      <p class="billboard-icon">⭐</p>
      <h3>Your Favorites list is empty</h3>
      <p class="billboard-subtext">
        Browse through the wiki index and click the
        <b>☆</b>
        icon next to any resource layout to pin it directly here!
      </p>
    </div>

    <div v-else class="dashboard-layout">
      <div class="dashboard-header">
        <p>
          Showing
          <b>{{ items.length }}</b>
          bookmarked references
        </p>
        <button class="clear-all-btn" @click="clearAllFavorites">
          Wipe All Bookmarks
        </button>
      </div>

      <ul class="favorites-grid">
        <li v-for="item in items" :key="item.url" class="favorite-card">
          <div class="card-details">
            <a
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="card-link"
            >
              {{ item.title }}
            </a>
            <span class="card-url-preview">{{ item.url }}</span>
          </div>
          <button
            class="card-delete-btn"
            title="Remove link"
            @click="removeFavorite(item.url)"
          >
            🗑️
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const items = ref([])

function loadSavedCollection() {
  if (typeof window !== 'undefined') {
    items.value = JSON.parse(localStorage.getItem('fmhy_favorites') || '[]')
  }
}

function removeFavorite(url) {
  let collection = JSON.parse(localStorage.getItem('fmhy_favorites') || '[]')
  collection = collection.filter((item) => item.url !== url)
  localStorage.setItem('fmhy_favorites', JSON.stringify(collection))
  loadSavedCollection()
  window.dispatchEvent(new Event('fmhy-favorites-sync'))
}

function clearAllFavorites() {
  if (
    confirm(
      'Are you sure you want to delete all saved links from local storage?'
    )
  ) {
    localStorage.removeItem('fmhy_favorites')
    loadSavedCollection()
    window.dispatchEvent(new Event('fmhy-favorites-sync'))
  }
}

onMounted(() => {
  loadSavedCollection()
  window.addEventListener('fmhy-favorites-sync', loadSavedCollection)
})

onUnmounted(() => {
  window.removeEventListener('fmhy-favorites-sync', loadSavedCollection)
})
</script>

<style scoped>
.favorites-wrapper {
  margin: 1.5rem 0;
}
.empty-billboard {
  background: var(--vp-c-bg-soft);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  padding: 3rem 1.5rem;
  text-align: center;
}
.billboard-icon {
  font-size: 2.5rem;
  margin: 0 0 1rem;
}
.billboard-subtext {
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  max-width: 440px;
  margin: 0.5rem auto 0;
  line-height: 1.5;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
.clear-all-btn {
  background: none;
  border: none;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
}
.clear-all-btn:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}
.favorites-grid {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.favorite-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}
.favorite-card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-alt);
}
.card-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.card-link {
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-size: 1.05rem;
}
.card-link:hover {
  color: var(--vp-c-brand-1);
}
.card-url-preview {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 550px;
}
.card-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.1rem;
  border-radius: 6px;
  transition: background 0.2s;
}
.card-delete-btn:hover {
  background: rgba(237, 60, 60, 0.1);
}
</style>
