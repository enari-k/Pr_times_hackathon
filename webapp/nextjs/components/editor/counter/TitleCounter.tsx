'use client';

interface Props {
  title: string;
}

export default function TitleCounter({ title }: Props) {
  return <div>タイトル文字数: {title.length}</div>;
}