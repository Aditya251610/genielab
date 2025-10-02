import { pool } from './mariadb.service';
import { ChatMessage } from '../types/chat';
import { RowDataPacket } from 'mysql2';

// Save a chat message into a thread
export async function saveChatMessage(sessionId: string, message: ChatMessage) {
  // Fetch existing messages first
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT message FROM chat_history WHERE session_id = ?',
    [sessionId]
  );

  let updatedMessages: ChatMessage[] = [];

  if (rows.length > 0 && rows[0]?.message) {
    try {
      const parsed = JSON.parse(rows[0]?.message as string);
      if (Array.isArray(parsed)) updatedMessages = parsed;
    } catch (err) {
      console.error('❌ Failed to parse existing chat messages:', err);
    }
  }

  // Append new message
  updatedMessages.push(message);

  // Insert or update the row
  await pool.query(
    `
    INSERT INTO chat_history (session_id, message, created_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      message = ?,
      created_at = NOW()
    `,
    [sessionId, JSON.stringify(updatedMessages), JSON.stringify(updatedMessages)]
  );
}

// Get all messages for a thread
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT message FROM chat_history WHERE session_id = ?',
    [sessionId]
  );

  if (!rows || rows.length === 0) return [];

  const row = rows[0];
  if (!row?.message) return [];

  try {
    const parsed = JSON.parse(row.message as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('❌ Failed to parse chat history JSON:', err);
    return [];
  }
}

// Optional: fetch all thread IDs for a user (if you store userId)
export async function getAllThreads(): Promise<{ session_id: string; updated_at: string }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT session_id, created_at FROM chat_history ORDER BY created_at DESC'
  );

  // Cast rows to the correct type
  return rows.map(row => ({
    session_id: row.session_id,
    updated_at: row.created_at,
  }));
}
