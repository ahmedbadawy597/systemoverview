import { useEffect, useRef, useState } from "react"

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Animates from the previously shown value to `target` with an ease-out curve. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const shown = useRef(value)

  useEffect(() => {
    const from = shown.current
    if (from === target || prefersReducedMotion()) {
      shown.current = target
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      const next = Math.round(from + (target - from) * eased)
      shown.current = next
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
