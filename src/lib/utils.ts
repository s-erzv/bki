import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const WIB = 'Asia/Jakarta'

export function toWIB(date: string | Date): Date {
  return toZonedTime(new Date(date), WIB)
}

export function formatWIB(date: string | Date, fmt: string): string {
  return format(toZonedTime(new Date(date), WIB), fmt, { timeZone: WIB })
}

export function formatDate(date: string | Date): string {
  return formatWIB(date, 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return formatWIB(date, 'dd MMM yyyy, HH:mm')
}

export function formatTime(date: string | Date): string {
  return formatWIB(date, 'HH:mm')
}
