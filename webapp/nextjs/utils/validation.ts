export const MAX_TITLE_LENGTH = 100;
export const MAX_CONTENT_LENGTH = 500;

export function validateTitle(title: string) {
  if (title.length === 0) {
    return 'タイトルを入力してください';
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return `タイトルは${MAX_TITLE_LENGTH}文字以内にしてください`;
  }

  return null;
}

export function validateContent(text: string) {
  if (text.length > MAX_CONTENT_LENGTH) {
    return `本文は${MAX_CONTENT_LENGTH}文字以内にしてください`;
  }

  return null;
}