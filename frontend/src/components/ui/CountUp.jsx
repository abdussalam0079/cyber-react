import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function CountUp({ value, duration = 1.2, decimals = 0, suffix = '', prefix = '', delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obj = { val: 0 }
    const tween = gsap.to(obj, {
      val: parseFloat(value),
      duration,
      delay,
      ease: 'power2.out',
      onUpdate() {
        if (el) el.textContent = prefix + obj.val.toFixed(decimals) + suffix
      },
    })
    return () => tween.kill()
  }, [value, duration, decimals, suffix, prefix, delay])

  return <span ref={ref}>{prefix}0{suffix}</span>
}
