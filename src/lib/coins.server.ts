type Sql = NonNullable<Awaited<ReturnType<typeof import("./db-access.server").getDb>>>;

export function normCoinUid(u: string) {
  return String(u || "").trim().toUpperCase();
}

/** One-time signup bonus; safe to call on every balance load. */
export async function ensureSignupBonus(s: Sql, uid: string) {
  const id = normCoinUid(uid);
  if (!id) return;
  const { SIGNUP_BONUS_COINS } = await import("./coin-rewards");
  await s`
    INSERT INTO coin_ledger (user_unique_id, action_key, amount)
    VALUES (${id}, 'signup', ${Math.max(0, Math.floor(SIGNUP_BONUS_COINS))})
    ON CONFLICT (user_unique_id, action_key) DO NOTHING
  `;
}

export async function getCoinBalanceForUser(s: Sql, uid: string): Promise<number> {
  const id = normCoinUid(uid);
  if (!id) return 0;
  await ensureSignupBonus(s, id);
  const rows = (await s`
    SELECT COALESCE(SUM(amount), 0)::int AS balance
    FROM coin_ledger WHERE user_unique_id = ${id}
  `) as { balance: number }[];
  return rows[0]?.balance ?? 0;
}

/** Move wallet + engagement rows when a member picks a custom SP-26 id. */
export async function migrateUserWalletId(s: Sql, oldUid: string, newUid: string) {
  const oldId = normCoinUid(oldUid);
  const newId = normCoinUid(newUid);
  if (!oldId || !newId || oldId === newId) return;

  await s`
    UPDATE coin_ledger SET user_unique_id = ${newId}
    WHERE user_unique_id = ${oldId}
  `;

  await s`
    INSERT INTO user_engagement (user_unique_id, current_streak, longest_streak, last_check_in, total_xp)
    SELECT ${newId}, current_streak, longest_streak, last_check_in, total_xp
    FROM user_engagement WHERE user_unique_id = ${oldId}
    ON CONFLICT (user_unique_id) DO UPDATE SET
      current_streak = GREATEST(user_engagement.current_streak, EXCLUDED.current_streak),
      longest_streak = GREATEST(user_engagement.longest_streak, EXCLUDED.longest_streak),
      total_xp = GREATEST(user_engagement.total_xp, EXCLUDED.total_xp),
      last_check_in = COALESCE(user_engagement.last_check_in, EXCLUDED.last_check_in),
      updated_at = now()
  `;
  await s`DELETE FROM user_engagement WHERE user_unique_id = ${oldId}`;

  await s`UPDATE quiz_attempts SET user_unique_id = ${newId} WHERE user_unique_id = ${oldId}`;
  await s`UPDATE questions SET unique_id = ${newId} WHERE unique_id = ${oldId}`;
  await s`UPDATE event_registrations SET user_unique_id = ${newId} WHERE user_unique_id = ${oldId}`;
  await s`UPDATE course_enrollments SET user_unique_id = ${newId} WHERE user_unique_id = ${oldId}`;
}
