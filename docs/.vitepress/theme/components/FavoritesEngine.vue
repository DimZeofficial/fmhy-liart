<template>
  <div style="display: none" />
</template>

<script setup>
import { useRoute } from 'vitepress'
import { nextTick, onMounted, watch } from 'vue'

const route = useRoute()

function injectFavoritesToggles() {
  // Target wiki resource anchor tags inside lists and paragraphs
  const links = document.querySelectorAll('.vp-doc ul li a, .vp-doc p a')

  links.forEach((link) => {
    // Only target active web links and prevent duplicate icon injections
    if (
      !link.href.startsWith('http') ||
      link.nextElementSibling?.classList.contains('fmhy-fav-toggle')
    )
      return

    const url = link.href
    const text = link.innerText || url

    const getStoredFavs = () =>
      JSON.parse(localStorage.getItem('fmhy_favorites') || '[]')
    let isFav = getStoredFavs().some((f) => f.url === url)

    // Build a subtle interactive toggle element
    const star = document.createElement('button')
    star.className = 'fmhy-fav-toggle'
    star.innerHTML = isFav ? '⭐' : '☆'
    star.title = isFav ? 'Remove from Favorites' : 'Add to Favorites'

    // Style inline to blend natively with text line-height arrangements
    star.style.cssText = `
      margin-left: 6px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0;
      display: inline-block;
      user-select: none;
      transition: transform 0.1s ease;
    `

    star.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()

      let currentFavs = getStoredFavs()
      const index = currentFavs.findIndex((f) => f.url === url)

      if (index > -1) {
        currentFavs.splice(index, 1)
        star.innerHTML = '☆'
        star.title = 'Add to Favorites'
      } else {
        currentFavs.push({ title: text, url: url })
        star.innerHTML = '⭐'
        star.title = 'Remove from Favorites'
      }

      localStorage.setItem('fmhy_favorites', JSON.stringify(currentFavs))

      // Dispatch a sync event to dynamically refresh dashboards if open in another tab
      window.dispatchEvent(new Event('fmhy-favorites-sync'))
    })

    // Insert the element cleanly right after the text anchor node
    link.parentNode.insertBefore(star, link.nextSibling)
  })
}

onMounted(() => {
  injectFavoritesToggles()

  // Listen for dashboard cleanups to sync icon outlines instantly
  window.addEventListener('fmhy-favorites-sync', () => {
    const currentFavs = JSON.parse(
      localStorage.getItem('fmhy_favorites') || '[]'
    )
    document.querySelectorAll('.fmhy-fav-toggle').forEach((star) => {
      const parentLink = star.previousElementSibling
      if (parentLink && parentLink.tagName === 'A') {
        const isStillFav = currentFavs.some((f) => f.url === parentLink.href)
        star.innerHTML = isStillFav ? '⭐' : '☆'
      }
    })
  })
})

// Keep watches active across internal page transitions
watch(
  () => route.path,
  () => {
    nextTick(() => {
      setTimeout(injectFavoritesToggles, 400)
    })
  }
)
</script>
