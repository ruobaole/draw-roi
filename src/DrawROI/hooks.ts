import { useEffect, useRef } from 'react'
import { fabric } from 'fabric'

type FabricEventHandler = (opt: fabric.IEvent) => void
// Ref: https://usehooks.com/useEventListener/
export function useEventListener(
  eventName: string,
  handler: FabricEventHandler,
  element?: fabric.Canvas
) {
  // Create a ref that stores handler
  const savedHandler = useRef<FabricEventHandler>()
  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(
    () => {
      if (savedHandler.current !== undefined && element !== undefined) {
        // Create event listener that calls handler function stored in ref
        const eventListener = (opt: fabric.IEvent) =>
          (savedHandler.current as FabricEventHandler)(opt)
        // Add event listener
        element.on(eventName, eventListener)
      }

      // Remove event listener on cleanup
      return () => {
        if (savedHandler.current !== undefined && element !== undefined) {
          element.off(eventName, savedHandler.current)
        }
      }
    },
    [eventName, element] // Re-run if eventName or element changes
  )
}
