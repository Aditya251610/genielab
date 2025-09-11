import { pool } from './mariadb.service';
import { ChatMessage } from '../types/chat';
import { RowDataPacket } from 'mysql2';

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT message FROM chat_history WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );
  return rows.map((r) => JSON.parse(r.message as string));
}

export async function saveChatMessage(sessionId: string, message: ChatMessage) {
  await pool.query(
    'INSERT INTO chat_history (session_id, message, created_at) VALUES (?, ?, NOW())',
    [sessionId, JSON.stringify(message)]
  );
}
