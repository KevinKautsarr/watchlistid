import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'id';

// ─── Translations Dictionary ───────────────────────────────────────────────
const translations = {
  en: {
    // General
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    loading: 'Loading...',
    none: 'None',
    ok: 'OK',
    goBack: 'Go Back',
    readLess: 'Read less',
    continue: 'Continue',
    
    // Auth
    authTagline: 'Your personal movie universe',
    signIn: 'Sign In',
    welcomeBack: 'Welcome back 👋',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    orContinueWith: 'Or continue with',
    google: 'Google',
    noAccount: "Don't have an account?",
    signUpNow: 'Sign up now',
    emailPasswordRequired: 'Email and password are required.',
    signUp: 'Sign Up',
    joinCommunity: 'Join our movie community ✨',
    username: 'Username',
    confirmPassword: 'Confirm Password',
    createAccount: 'Create Account',
    orSignUpWith: 'Or sign up with',
    alreadyHaveAccount: 'Already have an account?',
    signInHere: 'Sign in here',
    allFieldsRequired: 'All fields are required.',
    passwordsDontMatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 6 characters.',
    accountCreated: 'Account Created Successfully!',
    checkEmailVerification: 'Please check your email to verify your account before signing in.',
    backToLogin: 'Back to Login',
    forgotPasswordTitle: 'Forgot Password?',
    forgotPasswordDesc: 'Enter your email address and we will send you a link to reset your password.',
    emailSent: 'Email Sent!',
    checkInboxForReset: 'Check your inbox at {email} for the reset password link.',
    emailRequired: 'Email is required.',
    or: 'or',
    createNewAccount: 'Create new account',
    skipAndExplore: 'Skip & Explore Movies →',
    
    // Profile / Settings
    settings: 'Settings',
    diary: 'Diary',
    notifications: 'Notifications',
    exportWatchlist: 'Export Watchlist',
    about: 'WatchlistID',
    language: 'Language',
    signOut: 'Sign Out',
    total: 'Total',
    watched: 'Watched',
    toWatch: 'To Watch',
    memberSince: 'Member since',
    shareProfile: 'Share Profile',
    editProfile: 'Edit Profile',
    tapToAddBio: 'Tap ✏️ to add a bio',
    shortBioPlaceholder: 'Write a short bio…',
    yourNamePlaceholder: 'Your name',
    shareMessage: '🎬 Check out my movie journey on WATCHLISTID!\nI have watched {watched} movies and have {toWatch} on my watchlist.\nExplore my Diary: https://watchlistid.com/u/{username}',
    
    // Social
    followers: 'Followers',
    following: 'Following',
    follow: 'Follow',
    unfollow: 'Unfollow',
    noUsersFound: 'No users found',
    
    // Diary / Log Modal
    emptyDiary: 'No movies in your Diary yet.',
    emptyWatched: 'No watched movies yet.',
    emptyToWatch: 'Your watchlist is empty.',
    logMovie: 'Log Movie',
    logShow: 'Log Show',
    watchedOn: 'Watched on',
    yourRating: 'Your Rating',
    ratingHintDefault: 'Choose a rating for this movie',
    reviewOptional: 'Review (Optional)',
    reviewPlaceholder: 'Write your review, thoughts, or feelings...',
    
    // Modals
    signOutConfirmTitle: 'Sign Out?',
    signOutConfirmDesc: 'Are you sure you want to log out of your account?',
    deleteLogTitle: 'Delete Entry?',
    deleteLogDesc: 'Are you sure you want to delete this from your Diary? This action cannot be undone.',
    
    // Spoilers
    containsSpoiler: 'Contains Spoilers',
    spoilerDesc: 'Hide your review behind a warning to protect others from plot reveals.',
    clickToReveal: 'Review contains spoilers. Click to reveal.',
    hideSpoilers: 'Hide Spoilers',
    
    // Language Names
    english: 'English',
    indonesian: 'Bahasa Indonesia',
    
    // Tabs
    tabHome: 'Home',
    tabDiscover: 'Discover',
    tabWatchlist: 'Watchlist',
    tabProfile: 'Profile',
    
    // Home
    trendingMovies: 'Trending Movies',
    trendingShows: 'Trending Shows',
    popular: 'Popular',
    topRatedMovies: 'Top Rated Movies',
    topRatedShows: 'Top Rated Shows',
    recentlyViewed: 'Recently Viewed',
    seeAll: 'See All',
    browse: 'Browse',
    browseSub: 'Discover the latest and greatest in film & TV',
    browseByGenre: 'Browse by Genre',
    
    // Genres
    genreAction: 'Action',
    genreComedy: 'Comedy',
    genreDrama: 'Drama',
    genreHorror: 'Horror',
    genreSciFi: 'Sci-Fi',
    genreRomance: 'Romance',
    genreAdventure: 'Adventure',
    genreCrime: 'Crime',
    
    // Discover / Search
    searchPlaceholder: 'Search movies, shows, people...',
    discoverTitle: 'Discover',
    discoverSub: 'Search movies, shows, and people',
    noResults: 'No results',
    tryAnother: 'Try another keyword.',
    recent: 'Recent',
    trendingSearches: 'Trending Searches',
    trendingNow: 'Trending Now',
    trendingToday: 'Trending Today',
    trendingTV: 'Trending TV',
    loadMore: 'Load More',
    pageOf: 'Page {page} of {total}',
    actor: 'Actor',
    catPopularOn: 'Popular on WATCHLISTID',
    catTrendingMoviesSub: 'What the world is watching right now',
    catTrendingTVSub: 'Most-watched series this week',
    catPopularSub: 'Most-loved by our community',
    catTopRatedMoviesSub: 'Critically acclaimed films of all time',
    catTopRatedTVSub: 'The finest TV series ever made',
    filterAll: 'All',
    filterMovies: 'Movies',
    filterTV: 'TV Shows',
    filterAnime: 'Anime',
    filterAnimation: 'Animation',
    searchIn: 'Search in {category}…',
    searchMoviesTVPeople: 'Movies, TV shows, people…',
    showingResults: 'Showing {count} of {total} results',
    titlesCount: '{count} titles',
    titles: 'titles',
    
    // Movie Details
    imdbRating: 'IMDB RATING',
    popularity: 'POPULARITY',
    yourRatingLabel: 'YOUR RATING',
    log: 'Log',
    playTrailer: 'Play Trailer',
    inWatchlist: 'In Watchlist',
    addToWatchlist: 'Add to Watchlist',
    videos: 'Videos',
    videosCount: '{count} videos',
    storyline: 'Storyline',
    readMore: 'Read more',
    less: 'Less',
    topCast: 'Top Cast',
    details: 'Details',
    userReviews: 'User Reviews',
    moreLikeThis: 'More Like This',
    votes: 'votes',
    preparingExperience: 'Preparing experience...',
    contentNotFound: 'Oops! Content not found',
    contentNotFoundDesc: "We couldn't fetch the details for this title. It might be unavailable or there's a connection issue.",
    
    // Person Details
    born: 'Born',
    birthplace: 'Birthplace',
    biography: 'Biography',
    knownFor: 'Known For',
    filmography: 'Filmography',
    
    // Notifications
    markAllRead: 'Mark all read',
    allCaughtUp: 'All caught up!',
    noNotifications: "You don't have any new notifications at the moment.",
    
    // Metadata Table
    metaGenre: 'Genre',
    metaReleaseDate: 'Release Date',
    metaLanguage: 'Language',
    metaStatus: 'Status',
    metaBudget: 'Budget',
    metaRevenue: 'Revenue',
    metaRuntime: 'Runtime',
    metaProduction: 'Production',
    minutes: 'min',
    
    // Watchlist
    myWatchlist: 'My Watchlist',
    ratedByYou: 'rated by you',
    moviesShowsToWatch: 'Movies and shows to watch',
    emptyWatchlistTitle: 'Your watchlist is empty',
    emptyWatchlistSub: 'Movies and TV shows you add will appear here.',
    findMoviesBtn: 'Find Movies to Watch',
    rated: 'Rated',
  },
  id: {
    // General
    cancel: 'Batal',
    save: 'Simpan',
    delete: 'Hapus',
    close: 'Tutup',
    loading: 'Memuat...',
    none: 'Tidak ada',
    ok: 'OK',
    goBack: 'Kembali',
    readLess: 'Sembunyikan',
    continue: 'Lanjutkan',
    
    // Auth
    authTagline: 'Semesta film pribadimu',
    signIn: 'Masuk',
    welcomeBack: 'Selamat datang kembali 👋',
    email: 'Email',
    password: 'Kata Sandi',
    forgotPassword: 'Lupa kata sandi?',
    orContinueWith: 'Atau masuk dengan',
    google: 'Google',
    noAccount: 'Belum punya akun?',
    signUpNow: 'Daftar sekarang',
    emailPasswordRequired: 'Email dan password wajib diisi.',
    signUp: 'Daftar',
    joinCommunity: 'Bergabung dengan komunitas film kami ✨',
    username: 'Nama Pengguna',
    confirmPassword: 'Konfirmasi Kata Sandi',
    createAccount: 'Buat Akun',
    orSignUpWith: 'Atau daftar dengan',
    alreadyHaveAccount: 'Sudah punya akun?',
    signInHere: 'Masuk di sini',
    allFieldsRequired: 'Semua field wajib diisi.',
    passwordsDontMatch: 'Password dan konfirmasi tidak cocok.',
    passwordTooShort: 'Password minimal 6 karakter.',
    accountCreated: 'Akun Berhasil Dibuat!',
    checkEmailVerification: 'Silakan cek email Anda untuk verifikasi akun sebelum masuk.',
    backToLogin: 'Kembali ke Login',
    forgotPasswordTitle: 'Lupa Password?',
    forgotPasswordDesc: 'Masukkan email akun kamu. Kami akan kirimkan link untuk reset password.',
    emailSent: 'Email Terkirim!',
    checkInboxForReset: 'Cek inbox kamu di {email} untuk link reset password.',
    emailRequired: 'Email wajib diisi.',
    or: 'atau',
    createNewAccount: 'Buat akun baru',
    skipAndExplore: 'Lewati & Jelajahi Film →',
    
    // Profile / Settings
    settings: 'Pengaturan',
    diary: 'Diari',
    notifications: 'Notifikasi',
    exportWatchlist: 'Ekspor Watchlist',
    about: 'WatchlistID',
    language: 'Bahasa',
    signOut: 'Keluar',
    total: 'Total',
    watched: 'Ditonton',
    toWatch: 'Akan Ditonton',
    memberSince: 'Anggota sejak',
    shareProfile: 'Bagikan Profil',
    editProfile: 'Edit Profil',
    tapToAddBio: 'Ketuk ✏️ untuk menambah bio',
    shortBioPlaceholder: 'Tulis bio singkat…',
    yourNamePlaceholder: 'Nama Anda',
    shareMessage: '🎬 Lihat perjalanan film saya di WATCHLISTID!\nSaya sudah menonton {watched} film dan ada {toWatch} film di daftar tontonan saya.\nLihat Diari saya: https://watchlistid.com/u/{username}',
    
    // Social
    followers: 'Pengikut',
    following: 'Mengikuti',
    follow: 'Ikuti',
    unfollow: 'Batal Ikuti',
    noUsersFound: 'Pengguna tidak ditemukan',
    
    // Diary / Log Modal
    emptyDiary: 'Belum ada film di Diari kamu.',
    emptyWatched: 'Belum ada film yang ditonton.',
    emptyToWatch: 'Daftar tontonan kamu masih kosong.',
    logMovie: 'Catat Film',
    logShow: 'Catat Serial',
    watchedOn: 'Ditonton pada',
    yourRating: 'Nilai Kamu',
    ratingHintDefault: 'Pilih nilai untuk film ini',
    reviewOptional: 'Ulasan (Opsional)',
    reviewPlaceholder: 'Tulis ulasan, pikiran, atau perasaanmu...',
    
    // Modals
    signOutConfirmTitle: 'Keluar?',
    signOutConfirmDesc: 'Apakah kamu yakin ingin keluar dari akunmu?',
    deleteLogTitle: 'Hapus Entri Diari?',
    deleteLogDesc: 'Apakah kamu yakin ingin menghapus ini dari Diari kamu? Tindakan ini tidak dapat dibatalkan.',
    
    // Spoilers
    containsSpoiler: 'Mengandung Spoiler',
    spoilerDesc: 'Sembunyikan ulasanmu di balik peringatan untuk melindungi orang lain dari bocoran cerita.',
    clickToReveal: 'Ulasan mengandung spoiler. Klik untuk melihat.',
    hideSpoilers: 'Sembunyikan Spoiler',
    
    // Language Names
    english: 'English',
    indonesian: 'Bahasa Indonesia',

    // Tabs
    tabHome: 'Beranda',
    tabDiscover: 'Eksplor',
    tabWatchlist: 'Watchlist',
    tabProfile: 'Profil',
    
    // Home
    trendingMovies: 'Film Sedang Tren',
    trendingShows: 'Serial Sedang Tren',
    popular: 'Populer',
    topRatedMovies: 'Film Rating Tertinggi',
    topRatedShows: 'Serial Rating Tertinggi',
    recentlyViewed: 'Baru Saja Dilihat',
    seeAll: 'Lihat Semua',
    browse: 'Telusuri',
    browseSub: 'Temukan film & serial TV terbaik dan terbaru',
    browseByGenre: 'Telusuri berdasarkan Genre',
    
    // Genres
    genreAction: 'Aksi',
    genreComedy: 'Komedi',
    genreDrama: 'Drama',
    genreHorror: 'Horor',
    genreSciFi: 'Sci-Fi',
    genreRomance: 'Romantis',
    genreAdventure: 'Petualangan',
    genreCrime: 'Kriminal',
    
    // Discover / Search
    searchPlaceholder: 'Cari film, serial, aktor...',
    discoverTitle: 'Eksplor',
    discoverSub: 'Cari film, serial, dan aktor favoritmu',
    noResults: 'Tidak ada hasil',
    tryAnother: 'Coba kata kunci lain.',
    recent: 'Terakhir Dicari',
    trendingSearches: 'Pencarian Terpopuler',
    trendingNow: 'Sedang Tren',
    trendingToday: 'Tren Hari Ini',
    trendingTV: 'Serial TV Populer',
    loadMore: 'Muat Lebih Banyak',
    pageOf: 'Halaman {page} dari {total}',
    actor: 'Aktor',
    catPopularOn: 'Populer di WATCHLISTID',
    catTrendingMoviesSub: 'Apa yang sedang ditonton dunia saat ini',
    catTrendingTVSub: 'Serial paling banyak ditonton minggu ini',
    catPopularSub: 'Paling dicintai oleh komunitas kami',
    catTopRatedMoviesSub: 'Film dengan pujian kritis sepanjang masa',
    catTopRatedTVSub: 'Serial TV terbaik yang pernah dibuat',
    filterAll: 'Semua',
    filterMovies: 'Film',
    filterTV: 'Serial TV',
    filterAnime: 'Anime',
    filterAnimation: 'Animasi',
    searchIn: 'Cari di {category}…',
    searchMoviesTVPeople: 'Film, serial TV, aktor…',
    showingResults: 'Menampilkan {count} dari {total} hasil',
    titlesCount: '{count} judul',
    titles: 'judul',
    
    // Movie Details
    imdbRating: 'RATING IMDB',
    popularity: 'POPULARITAS',
    yourRatingLabel: 'NILAI KAMU',
    log: 'Catat',
    playTrailer: 'Putar Trailer',
    inWatchlist: 'Di Watchlist',
    addToWatchlist: 'Tambah ke Watchlist',
    videos: 'Video',
    videosCount: '{count} video',
    storyline: 'Alur Cerita',
    readMore: 'Baca selengkapnya',
    less: 'Sembunyikan',
    topCast: 'Pemeran Utama',
    details: 'Detail',
    userReviews: 'Ulasan Pengguna',
    moreLikeThis: 'Serupa',
    votes: 'suara',
    preparingExperience: 'Menyiapkan pengalaman...',
    contentNotFound: 'Ups! Konten tidak ditemukan',
    contentNotFoundDesc: 'Kami tidak dapat mengambil detail untuk judul ini. Mungkin tidak tersedia atau ada masalah koneksi.',
    
    // Person Details
    born: 'Lahir',
    birthplace: 'Tempat Lahir',
    biography: 'Biografi',
    knownFor: 'Dikenal Karena',
    filmography: 'Filmografi',
    
    // Notifications
    markAllRead: 'Tandai semua sudah dibaca',
    allCaughtUp: 'Semuanya sudah beres!',
    noNotifications: 'Kamu tidak memiliki notifikasi baru saat ini.',
    
    // Metadata Table
    metaGenre: 'Genre',
    metaReleaseDate: 'Tanggal Rilis',
    metaLanguage: 'Bahasa',
    metaStatus: 'Status',
    metaBudget: 'Anggaran',
    metaRevenue: 'Pendapatan',
    metaRuntime: 'Durasi',
    metaProduction: 'Produksi',
    minutes: 'menit',
    
    // Watchlist
    myWatchlist: 'Daftar Tontonan',
    ratedByYou: 'telah kamu nilai',
    moviesShowsToWatch: 'Film dan serial untuk ditonton',
    emptyWatchlistTitle: 'Daftar tontonan kamu masih kosong',
    emptyWatchlistSub: 'Film dan serial yang kamu tambahkan akan muncul di sini.',
    findMoviesBtn: 'Cari Film untuk Ditonton',
    rated: 'Dinilai',
  }
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('app_language');
        if (savedLang === 'en' || savedLang === 'id') {
          setLanguageState(savedLang);
        }
      } catch (error) {
        console.error('Error loading language', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('app_language', lang);
    } catch (error) {
      console.error('Error saving language', error);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
