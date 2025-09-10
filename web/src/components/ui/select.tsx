import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

// Simple Select implementation without Radix UI
const Select = React.forwardRef<HTMLDivElement, { 
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}>(({ value, onValueChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")

  const selectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onSelect = (itemValue: string) => {
    setSelectedValue(itemValue)
    setIsOpen(false)
    if (onValueChange) {
      onValueChange(itemValue)
    }
  }

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Only pass props to components that need them
          const childProps: any = {}
          
          if (child.type === SelectTrigger) {
            childProps.isOpen = isOpen
            childProps.setIsOpen = setIsOpen
            childProps.selectedValue = selectedValue
          } else if (child.type === SelectContent) {
            childProps.isOpen = isOpen
            childProps.onSelect = onSelect
          } else if (child.type === SelectValue) {
            childProps.selectedValue = selectedValue
          }
          
          return React.cloneElement(child as React.ReactElement<any>, childProps)
        }
        return child
      })}
    </div>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps & {
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
  selectedValue?: string
}>(({ className, children, isOpen, setIsOpen, selectedValue, ...props }, ref) => {
  // Filter out custom props before spreading to DOM element
  const { isOpen: _, setIsOpen: __, selectedValue: ___, ...domProps } = props as any
  
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen && setIsOpen(!isOpen)}
      {...domProps}
    >
      {children}
      <span className="text-gray-400">
        {isOpen ? "▲" : "▼"}
      </span>
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps & {
  selectedValue?: string
}>(({ placeholder, selectedValue }, ref) => {
  const displayValue = selectedValue || placeholder || "Select..."
  
  return (
    <span ref={ref} className={cn(
      selectedValue ? "text-foreground" : "text-muted-foreground"
    )}>
      {displayValue}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps & {
  isOpen?: boolean
  onSelect?: (value: string) => void
}>(({ className, children, isOpen, onSelect }, ref) => {
  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Only pass onSelect to SelectItem components
            const childProps: any = {}
            
            if (child.type === SelectItem) {
              childProps.onSelect = onSelect
            }
            
            return React.cloneElement(child as React.ReactElement<any>, childProps)
          }
          return child
        })}
      </div>
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps & {
  onSelect?: (value: string) => void
}>(({ className, value, children, onSelect, ...props }, ref) => {
  // Filter out custom props before spreading to DOM element
  const { onSelect: _, ...domProps } = props as any
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={() => onSelect && onSelect(value)}
      {...domProps}
    >
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}