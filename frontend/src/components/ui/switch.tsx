import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch as SwitchPrimitive } from "radix-ui"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // Glacier: 48x26 pill, accent-fill gradient when on, inset control
        // surface when off (matches the hand-rolled Toggle it replaces).
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all duration-300 outline-none disabled:cursor-not-allowed disabled:opacity-40 data-[size=default]:h-[26px] data-[size=default]:w-12 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=unchecked]:bg-[var(--surface-control)] data-[state=checked]:[background:var(--accent-fill)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Glacier thumb: 20px pearl; off-state is a hollow ring of
          // --border-accent, on-state solid white with a frost drop.
          "pointer-events-none block rounded-full ring-0 transition-transform duration-300 group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-3 data-[state=unchecked]:translate-x-[3px] data-[state=checked]:translate-x-[25px] data-[state=checked]:bg-white data-[state=checked]:[box-shadow:0_2px_8px_var(--border-accent)] data-[state=unchecked]:bg-[rgba(255,255,255,0.05)] data-[state=unchecked]:[box-shadow:inset_0_0_0_2px_var(--border-accent)]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
