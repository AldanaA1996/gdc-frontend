import { Toaster as Sonner } from "sonner"
import type { ToasterProps } from "sonner"

const Toaster = ({ richColors = true, position = "top-right", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      richColors={richColors}
      position={position}
      className="toaster group"
      toastOptions={{
        style: {
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
