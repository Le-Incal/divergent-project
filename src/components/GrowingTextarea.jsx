import { useEffect, useRef } from 'react'

export default function GrowingTextarea({ value, ...props }) {
  const ref = useRef(null)

  useEffect(() => {
    const field = ref.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = `${field.scrollHeight}px`
  }, [value])

  return <textarea ref={ref} value={value} {...props} />
}
