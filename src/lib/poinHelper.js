import { supabase } from './supabase'

// Konstanta poin per aksi
export const POIN_AKSI = {
  donasi_porsi: 50,
  volunteer_relay: 30,
  tracking_gizi: 10,
  input_balita: 20,
}

// Fungsi utama: tambah poin user
export async function tambahPoin(userId, aksi, keterangan = '') {
  const poin = POIN_AKSI[aksi]
  if (!poin) return

  // 1. Catat ke history
  await supabase.from('poin_history').insert({
    user_id: userId,
    aksi,
    poin,
    keterangan,
  })

  // 2. Update total poin di profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('poin')
    .eq('id', userId)
    .single()

  const poinBaru = (profile?.poin || 0) + poin

  await supabase
    .from('profiles')
    .update({ poin: poinBaru })
    .eq('id', userId)

  // 3. Cek dan update badge level
  await cekDanBeriBadge(userId, poinBaru)

  return poinBaru
}

// Cek level badge berdasarkan total poin
async function cekDanBeriBadge(userId, totalPoin) {
  let badgeSlug = null

  if (totalPoin >= 2000) badgeSlug = 'lumbung-master'
  else if (totalPoin >= 500) badgeSlug = 'petani-aktif'
  else badgeSlug = 'penabur-benih'

  // Insert badge (ignore kalau sudah ada)
  await supabase.from('user_badges').upsert(
    { user_id: userId, badge_slug: badgeSlug },
    { onConflict: 'user_id,badge_slug', ignoreDuplicates: true }
  )
}