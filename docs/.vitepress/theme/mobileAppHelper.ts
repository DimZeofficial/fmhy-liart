import { App } from '@capacitor/app'

const isNativeApp = () => {
  return (
    typeof window !== 'undefined' && (window as any).Capacitor !== undefined
  )
}

export function initAndroidBackButton() {
  if (!isNativeApp()) return
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      App.exitApp()
    }
  })
}

export function initMobileGestures() {
  if (typeof window === 'undefined') return

  let touchStartX = 0
  let touchStartY = 0
  const EDGE_THRESHOLD = 40
  const SWIPE_MIN_DIST = 70

  window.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].screenX
      touchStartY = e.touches[0].screenY
    },
    { passive: true }
  )

  window.addEventListener(
    'touchend',
    (e) => {
      const touchEndX = e.changedTouches[0].screenX
      const touchEndY = e.changedTouches[0].screenY
      const diffX = touchEndX - touchStartX
      const diffY = Math.abs(touchEndY - touchStartY)

      if (diffY > 40) return // Ignore vertical scroll actions

      // Swipe Right (Go back or open mobile menu)
      if (diffX > SWIPE_MIN_DIST && touchStartX < EDGE_THRESHOLD) {
        const sidebarButton = document.querySelector(
          '.VPLocalNav .menu'
        ) as HTMLElement
        const sidebar = document.querySelector('.VPSidebar') as HTMLElement
        if (sidebarButton && !sidebar?.classList.contains('open')) {
          sidebarButton.click()
        } else {
          window.history.back()
        }
      }

      // Swipe Left (Close mobile menu or go forward)
      if (diffX < -SWIPE_MIN_DIST) {
        const backdrop = document.querySelector('.VPBackdrop') as HTMLElement
        if (
          backdrop &&
          document.querySelector('.VPSidebar')?.classList.contains('open')
        ) {
          backdrop.click()
        } else {
          window.history.forward()
        }
      }
    },
    { passive: true }
  )
}
