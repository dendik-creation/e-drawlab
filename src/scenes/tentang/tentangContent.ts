/**
 * Tentang scene copy — kept apart from the component so these can be edited
 * without touching any layout code. `DEVELOPER_PROFILE` and `DAFTAR_PUSTAKA`
 * are placeholders: swap them for the real credits/citations whenever
 * they're ready.
 */

export const DEVELOPER_PROFILE = {
  nama: 'Orang Developer',
  mataPelajaran: 'Teknik Elektronika',
  instansi: 'Sekolahku',
  email: 'sekolahku@sekolah.sch.id',
  tahunPembuatan: '2026',
}

export const ASET_GAMBAR =
  'Gambar dan ilustrasi dalam aplikasi ini dibuat menggunakan Figma, Freepik, dan OpenAI Image Generator.'

export const ASET_MUSIK =
  'Musik dan efek suara dalam aplikasi ini dibuat menggunakan Pixabay, Envato Elements (Free), dan Claude AI.'

/** One paragraph per citation, APA-style. */
export const DAFTAR_PUSTAKA: string[] = ['Ini daftar pustakanya (APA Format)']
