import dayjs from 'dayjs';

export class DateUtil {
  static formatBirthday(date?: Date | string | null): string | null {
    if (!date) return null;

    return dayjs(date).format('DD/MM/YYYY');
  }

  static formatDateTime(date?: Date | string | null): string | null {
    if (!date) return null;

    return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
  }
}
