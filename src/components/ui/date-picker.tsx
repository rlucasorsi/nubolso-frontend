"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations } from "@/i18n/useTranslations"
import { useLanguage } from "@/i18n/LanguageContext"
import { getDateFnsLocale } from "@/i18n/dateFnsLocale"

interface DatePickerProps {
  date?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  minDate?: string
}

export function DatePicker({ date, onChange, placeholder, className, minDate }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const tCommon = useTranslations("common")
  const { locale } = useLanguage()
  const dateFnsLocale = getDateFnsLocale(locale)
  const resolvedPlaceholder = placeholder ?? tCommon("selectDate")
  const selectedDate = date ? parseISO(date) : undefined
  const minSelectableDate = minDate ? parseISO(minDate) : undefined

  const trigger = (
    <Button
      variant={"outline"}
      className={cn(
        "w-full justify-start text-left font-normal h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all",
        !date && "text-muted-foreground",
        className
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
      {selectedDate ? (
        format(selectedDate, "PPP", { locale: dateFnsLocale })
      ) : (
        <span>{resolvedPlaceholder}</span>
      )}
    </Button>
  )

  const calendar = (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(d) => {
        if (d) {
          onChange?.(format(d, "yyyy-MM-dd"))
          setOpen(false)
        }
      }}
      disabled={minSelectableDate ? { before: minSelectableDate } : undefined}
      initialFocus
      locale={dateFnsLocale}
      className="bg-card"
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent className="p-0 border-none bg-card">
          <DrawerTitle className="sr-only">{resolvedPlaceholder}</DrawerTitle>
          <div className="flex justify-center p-4 pb-10">
            {calendar}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card border-white/10 shadow-2xl rounded-2xl overflow-hidden" align="start">
        {calendar}
      </PopoverContent>
    </Popover>
  )
}
