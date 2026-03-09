"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
}

export default function LinkCard({ editor }: Props) {
  const [url, setUrl] = useState("");

  const handleInsert = async () => {
    if (!editor || !url) return;

    const res = await fetch("/api/ogp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    editor.commands.insertContent(`
      <a href="${data.url}" target="_blank">
        <div class="border rounded-lg flex overflow-hidden">
          ${data.image ? `<img src="${data.image}" class="w-32 object-cover"/>` : ""}
          <div class="p-3">
            <div class="font-bold">${data.title}</div>
            <div class="text-sm text-gray-600">${data.description}</div>
          </div>
        </div>
      </a>
    `);

    setUrl("");
  };

  return (
    <div className="flex gap-2">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URLを入力"
        className="border p-1 rounded"
      />

      <button
        onClick={handleInsert}
        className="border px-2 py-1 rounded"
      >
        カード追加
      </button>
    </div>
  );
}