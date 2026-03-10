export const MAX_TITLE_LENGTH = 100;
export const MAX_CONTENT_LENGTH = 500;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif'];

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

export function validateImage(file: File) {
  // サイズチェック
  if (file.size > MAX_IMAGE_SIZE) {
    return '画像サイズは5MB以下にしてください';
  }

  // 拡張子チェック
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return '画像形式は .jpg / .png / .gif のみ対応しています';
  }

  return null;
}