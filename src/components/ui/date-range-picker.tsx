
"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, isAfter, isBefore, isValid } from "date-fns"
import { ptBR } from 'date-fns/locale'
import { DateRange, SelectRangeEventHandler } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DateRangePickerProps {
  /**
   * The selected date range.
   */
  initialDateFrom?: Date | string
  initialDateTo?: Date | string
  /**
   * The number of months to display.
   */
  numberOfMonths?: number
  /**
   * The date to which the calendar is aligned.
   */
  align?: "start" | "center" | "end"
  /**
   * The locale to use for formatting dates.
   */
  locale?: string
  /**
   * Whether to show the comparison feature.
   */
  showCompare?: boolean
  /**
   * The function to call when the date range is updated.
   */
  onUpdate?: (values: { range: DateRange; rangeCompare?: DateRange }) => void
}

const PRESETS = [
  { name: "today", label: "Hoje" },
  { name: "yesterday", label: "Ontem" },
  { name: "last7", label: "Últimos 7 dias" },
  { name: "last14", label: "Últimos 14 dias" },
  { name: "last30", label: "Últimos 30 dias" },
  { name: "thisWeek", label: "Esta semana" },
  { name: "lastWeek", label: "Semana passada" },
  { name: "thisMonth", label: "Este mês" },
  { name: "lastMonth", label: "Mês passado" },
]

export function DateRangePicker({
  initialDateFrom,
  initialDateTo,
  numberOfMonths = 2,
  align = "center",
  locale = "pt-BR",
  showCompare = true,
  onUpdate,
}: DateRangePickerProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: initialDateFrom ? new Date(initialDateFrom) : undefined,
    to: initialDateTo ? new Date(initialDateTo) : undefined,
  })
  const [rangeCompare, setRangeCompare] = React.useState<
    DateRange | undefined
  >(undefined)

  // Refs to store the values of the date range pickers
  const rangeRef = React.useRef(range)
  const rangeCompareRef = React.useRef(rangeCompare)

  const onSelectRange: SelectRangeEventHandler = (
    range: DateRange | undefined
  ) => {
    setRange(range)
    if (range) {
      rangeRef.current = range
    }
  }

  const onSelectRangeCompare: SelectRangeEventHandler = (
    range: DateRange | undefined
  ) => {
    setRangeCompare(range)
    if (range) {
      rangeCompareRef.current = range
    }
  }

  // Helper function to get the date range from a preset
  const getPresetRange = (presetName: string): DateRange => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (presetName) {
      case "today":
        return { from: today, to: today }
      case "yesterday":
        const yesterday = addDays(today, -1)
        return { from: yesterday, to: yesterday }
      case "last7":
        return { from: addDays(today, -6), to: today }
      case "last14":
        return { from: addDays(today, -13), to: today }
      case "last30":
        return { from: addDays(today, -29), to: today }
      case "thisWeek":
        return { from: addDays(today, -today.getDay()), to: today }
      case "lastWeek":
        const lastWeekStart = addDays(today, -today.getDay() - 7)
        const lastWeekEnd = addDays(lastWeekStart, 6)
        return { from: lastWeekStart, to: lastWeekEnd }
      case "thisMonth":
        return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        return {
          from: lastMonth,
          to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
        }
      default:
        throw new Error(`Unknown preset: ${presetName}`)
    }
  }

  const setPreset = (presetName: string) => {
    const newRange = getPresetRange(presetName)
    setRange(newRange)
    if (rangeCompare) {
      const newRangeCompare = getPresetRange(presetName)
      const diffInDays = (newRange.to?.getTime() ?? 0 - (newRange.from?.getTime() ?? 0)) / (1000 * 60 * 60 * 24)
      setRangeCompare({
        from: addDays(newRangeCompare.from ?? new Date(), -diffInDays - 1),
        to: addDays(newRangeCompare.to ?? new Date(), -diffInDays - 1),
      })
    }
  }

  const onOpenChange = (open: boolean) => {
    if (!open) {
      // When the popover is closed, update the local refs
      rangeRef.current = range
      rangeCompareRef.current = rangeCompare
    }
    setIsOpen(open)
  }

  const onCancel = () => {
    // When the cancel button is clicked, revert the state to the stored refs
    setRange(rangeRef.current)
    setRangeCompare(rangeCompareRef.current)
    setIsOpen(false)
  }

  const onApply = () => {
    // When the apply button is clicked, update the parent state
    setIsOpen(false)
    if (onUpdate) {
      onUpdate({ range: range!, rangeCompare })
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, "LLL dd, y", {locale: ptBR})} - {format(range.to, "LLL dd, y", {locale: ptBR})}
              </>
            ) : (
              format(range.from, "LLL dd, y")
            )
          ) : (
            <span>Selecione uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="grid gap-2">
          <div className="flex items-center justify-start p-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-start gap-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Início
                </div>
                <div
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-9 w-[150px] justify-start text-left font-normal"
                  )}
                >
                  {range?.from ? format(range.from, "MMM d, yyyy") : "-"}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Fim
                </div>
                <div
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-9 w-[150px] justify-start text-left font-normal"
                  )}
                >
                  {range?.to ? format(range.to, "MMM d, yyyy") : "-"}
                </div>
              </div>
            </div>
            {showCompare && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-start gap-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Compare From
                  </div>
                  <div
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-9 w-[150px] justify-start text-left font-normal"
                    )}
                  >
                    {rangeCompare?.from
                      ? format(rangeCompare.from, "MMM d, yyyy")
                      : "-"}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Compare To
                  </div>
                  <div
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-9 w-[150px] justify-start text-left font-normal"
                    )}
                  >
                    {rangeCompare?.to
                      ? format(rangeCompare.to, "MMM d, yyyy")
                      : "-"}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between border-t border-border p-2">
            <Select onValueChange={(value) => setPreset(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button onClick={onCancel} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={onApply}>Aplicar</Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-2">
          <Calendar
            mode="range"
            onSelect={onSelectRange}
            selected={range}
            numberOfMonths={numberOfMonths}
            defaultMonth={range?.from}
            locale={ptBR}
            disabled={(date) =>
              (rangeCompare?.from &&
                isAfter(date, rangeCompare.from) &&
                !rangeCompare.to) ||
              (rangeCompare?.from &&
                rangeCompare.to &&
                isAfter(date, rangeCompare.from) &&
                isBefore(date, rangeCompare.to)) ||
              false
            }
          />
          {showCompare && (
            <Calendar
              mode="range"
              onSelect={onSelectRangeCompare}
              selected={rangeCompare}
              numberOfMonths={numberOfMonths}
              defaultMonth={rangeCompare?.from}
              locale={ptBR}
              disabled={(date) =>
                (range?.from &&
                  isBefore(date, range.from) &&
                  !range.to) ||
                (range?.from &&
                  range.to &&
                  isBefore(date, range.from) &&
                  isAfter(date, range.to)) ||
                false
              }
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
