/**
 * Validation Utility Functions
 */

import { MAX_VALUES } from '../config/constants';

/**
 * Validate habit name
 */
export const validateHabitName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Tên thói quen không được để trống' };
  }
  if (name.length > MAX_VALUES.HABIT_NAME_LENGTH) {
    return { valid: false, error: `Tên thói quen không được vượt quá ${MAX_VALUES.HABIT_NAME_LENGTH} ký tự` };
  }
  return { valid: true };
};

/**
 * Validate description
 */
export const validateDescription = (description) => {
  if (description && description.length > MAX_VALUES.DESCRIPTION_LENGTH) {
    return { valid: false, error: `Mô tả không được vượt quá ${MAX_VALUES.DESCRIPTION_LENGTH} ký tự` };
  }
  return { valid: true };
};

/**
 * Validate completions per day
 */
export const validateCompletionsPerDay = (count) => {
  const num = parseInt(count);
  if (isNaN(num) || num < 1) {
    return { valid: false, error: 'Số lần hoàn thành phải lớn hơn 0' };
  }
  if (num > MAX_VALUES.COMPLETIONS_PER_DAY) {
    return { valid: false, error: `Số lần hoàn thành không được vượt quá ${MAX_VALUES.COMPLETIONS_PER_DAY}` };
  }
  return { valid: true };
};

/**
 * Validate note content
 */
export const validateNoteContent = (content) => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Nội dung ghi chú không được để trống' };
  }
  if (content.length > MAX_VALUES.NOTE_LENGTH) {
    return { valid: false, error: `Ghi chú không được vượt quá ${MAX_VALUES.NOTE_LENGTH} ký tự` };
  }
  return { valid: true };
};